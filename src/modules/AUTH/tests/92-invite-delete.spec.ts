import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InviteApi } from "../Api/invite.api";
import { buildUniqueInviteEmail, InviteTestData } from "../Data/invite.data";
import { InviteMapper } from "../Mapper/invite.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import {
  AuthErrorResponseSchema,
  InviteUserResponseSchema,
  SentInvitationsListResponseSchema,
} from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import {
  findReusablePendingInvitation,
  INVITE_PROVISION_TEST_TIMEOUT_MS,
  inviteUserWithRetry,
} from "../utils/invite-provision.helper";

test.describe("Auth Invite Delete API", () => {
  test.describe.configure({
    mode: "serial",
    timeout: INVITE_PROVISION_TEST_TIMEOUT_MS,
  });

  test(
    "Delete pending invitation by ID and verify removed from mine list",
    { tag: ["@auth", "@invite"] },
    async ({ authenticatedApi }) => {
      const api = new InviteApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const rolesResponse = await api.getRoles();
      const role = InviteMapper.resolveInvitableRole(
        rolesResponse.responseBody,
        InviteTestData.preferredRoles,
        InviteTestData.fallbackRole,
      );
      const reusable = await findReusablePendingInvitation(api);
      let invitationId = reusable?.invitationId ?? "";
      let inviteResponse: Awaited<ReturnType<typeof inviteUserWithRetry>> | null =
        null;

      if (!invitationId) {
        const inviteEmail = buildUniqueInviteEmail("delete-invite");
        inviteResponse = await inviteUserWithRetry(api, {
          email: inviteEmail,
          role,
        });

        const parsed = InviteUserResponseSchema.parse(inviteResponse.responseBody);
        invitationId = parsed.data.invitationId;

        await PerformanceTracker.track(
          inviteResponse.rawResponse,
          "Auth Invite Delete API — Create",
          `${process.env.BASE_URL}/indore/auth/invite`,
          inviteResponse.responseTime,
        );
      }

      const deleteResponse = await api.deleteInvitation(invitationId);

      await PerformanceTracker.track(
        deleteResponse.rawResponse,
        "Auth Invite Delete API",
        `${process.env.BASE_URL}/indore/auth/invitations/${invitationId}`,
        deleteResponse.responseTime,
      );

      const listResponse = await api.listMyInvitations({
        page: 1,
        limit: InviteTestData.e2eListScanLimit,
        status: "all",
      });
      const lookup = await api.findInvitationInMyList(
        invitationId,
        InviteTestData.e2eListScanLimit,
      );

      try {
        if (inviteResponse) {
          validation.execute("Create Invite Status", () =>
            assert.validateStatusCode(inviteResponse!.rawResponse, 201),
          );
        }
        validation.execute("Delete Status", () =>
          validator.validateDeleteInvitationSuccess(
            deleteResponse.rawResponse.status(),
          ),
        );
        validation.execute("Delete Response Time", () =>
          assert.validateResponseTime(
            deleteResponse.responseTime,
            InviteTestData.maxResponseTimeMs,
          ),
        );
        validation.execute("Delete Sensitive Data", () =>
          assert.validateSensitiveData(deleteResponse.responseBody),
        );

        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(listResponse.responseBody),
        );
        validation.execute("Removed From Mine List", () =>
          validator.validateInvitationRemovedFromList(list, invitationId),
        );
        validation.execute("Removed By ID Lookup", () => {
          expect(lookup.item).toBeNull();
        });
      } finally {
        validation.finalize("Auth Invite Delete API", deleteResponse.responseTime);
      }
    },
  );

  test(
    "Reject delete for unknown invitation ID",
    { tag: ["@auth", "@invite"] },
    async ({ authenticatedApi }) => {
      const api = new InviteApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const deleteResponse = await api.deleteInvitation(
        InviteTestData.notFoundInvitationId,
      );

      try {
        validation.execute("Delete Not Found Contract", () =>
          validator.validateDeleteInvitationNotFound(
            deleteResponse.rawResponse.status(),
            deleteResponse.responseBody,
            InviteTestData.deleteErrorCodes.notFound,
          ),
        );
        validation.execute("Delete Not Found Zod", () => {
          const result = AuthErrorResponseSchema.safeParse(deleteResponse.responseBody);
          expect(result.success).toBe(true);
        });
      } finally {
        validation.finalize("Auth Invite Delete API (not found)", 0);
      }
    },
  );
});
