import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InviteApi } from "../Api/invite.api";
import {
  buildUniqueInviteEmail,
  InviteTestData,
} from "../Data/invite.data";
import { InviteMapper } from "../Mapper/invite.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import {
  InviteUserRequestSchema,
  InviteUserResponseSchema,
  SentInvitationsListResponseSchema,
} from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { printInviteCrossVerification } from "../utils/invite-verification.reporter";
import {
  INVITE_PROVISION_TEST_TIMEOUT_MS,
  inviteUserWithRetry,
  isInviteTransientStatus,
} from "../utils/invite-provision.helper";

test.describe("Auth Invite User API", () => {
  test.describe.configure({
    mode: "serial",
    timeout: INVITE_PROVISION_TEST_TIMEOUT_MS,
  });

  test(
    "Reject unknown invite role",
    { tag: ["@auth", "@invite"] },
    async ({ authenticatedApi }) => {
      const api = new InviteApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      try {
        const response = await inviteUserWithRetry(api, {
          email: buildUniqueInviteEmail("bad-role"),
          role: InviteTestData.invalidRole,
        });

        const status = response.rawResponse.status();
        if (isInviteTransientStatus(status)) {
          test.skip(
            true,
            `Invite POST rate limited (${status}) — cannot validate unknown role rejection. Wait 30–60 minutes and re-run.`,
          );
          return;
        }

        validation.execute("Unknown Role Status", () =>
          validator.validateUnknownRoleError(
            response.rawResponse.status(),
            response.responseBody,
            InviteTestData.invalidRole,
          ),
        );
      } finally {
        validation.finalize("Auth Invite Unknown Role", 0);
      }
    },
  );

  test(
    "Validate invite user, list, and cleanup",
    { tag: ["@smoke", "@auth", "@invite"] },
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
      const inviteEmail = buildUniqueInviteEmail();
      const invitePayload = { email: inviteEmail, role };

      let invitationId = "";
      let responseTime = 0;

      try {
        validation.execute("Invite Request Schema", () => {
          expect(InviteUserRequestSchema.safeParse(invitePayload).success).toBe(
            true,
          );
        });

        const inviteResponse = await inviteUserWithRetry(api, invitePayload);
        responseTime = inviteResponse.responseTime;

        await PerformanceTracker.track(
        inviteResponse.rawResponse,
        "Auth Invite User API",
        inviteResponse.rawResponse.url(),
        inviteResponse.responseTime
      );

        validation.execute("Invite Status", () =>
          assert.validateStatusCode(
            inviteResponse.rawResponse,
            201,
            inviteResponse.responseBody,
          ),
        );
        validation.execute("Invite Content Type", () =>
          assert.validateContentType(inviteResponse.rawResponse),
        );
        validation.execute("Invite Response Time", () =>
          assert.validateResponseTime(
            inviteResponse.responseTime,
            InviteTestData.maxResponseTimeMs,
          ),
        );
        validation.execute("Invite Sensitive Data", () =>
          assert.validateSensitiveData(inviteResponse.responseBody),
        );

        if (inviteResponse.rawResponse.status() === 201) {
          validation.execute("Invite Zod", () => {
            const result = InviteUserResponseSchema.safeParse(
              inviteResponse.responseBody,
            );
            expect(
              result.success,
              result.success
                ? "Zod validation passed"
                : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
            ).toBe(true);
          });

          const parsed = InviteUserResponseSchema.parse(
            inviteResponse.responseBody,
          );
          const inviteModel = InviteMapper.mapInviteUser(parsed);
          invitationId = inviteModel.invitationId;

          validation.execute("Invite Business Rules", () =>
            validator.validateInviteUserResponse(
              inviteModel,
              inviteEmail,
              new Date(),
              InviteTestData.inviteExpiryToleranceMs,
            ),
          );

          const listResponse = await api.listMyInvitations({
            page: InviteTestData.listPage,
            limit: InviteTestData.listLimit,
            status: "all",
          });

          validation.execute("List Status", () =>
            assert.validateStatusCode(listResponse.rawResponse, 200),
          );

          if (listResponse.rawResponse.status() === 200) {
            validation.execute("List Zod", () => {
              const result = SentInvitationsListResponseSchema.safeParse(
                listResponse.responseBody,
              );
              expect(result.success).toBe(true);
            });

            const listModel = InviteMapper.mapSentInvitationsList(
              SentInvitationsListResponseSchema.parse(listResponse.responseBody),
            );

            validation.execute("Created Invitation In List", () => {
              validator.validateCreatedInvitationInList(
                listModel,
                invitationId,
                inviteEmail,
                role,
              );
              const listed = InviteMapper.findInvitationById(
                listModel,
                invitationId,
              );
              expect(listed).toBeDefined();
              validator.validateInvitationItem(listed!);
            });

            validation.execute("Email Verified", () => {
              expect(InviteMapper.emailsMatch(inviteEmail, inviteModel.email)).toBe(
                true,
              );
              const listed = InviteMapper.findInvitationById(
                listModel,
                invitationId,
              );
              expect(listed).toBeDefined();
              expect(InviteMapper.emailsMatch(inviteEmail, listed!.email)).toBe(
                true,
              );
            });

            validation.execute("User Invite Created", () => {
              expect(invitationId.length).toBeGreaterThan(0);
              expect(inviteModel.emailSent).toBe(true);
            });

            printInviteCrossVerification({
              email: inviteEmail,
              invitationId,
              role,
              status: "pending",
              emailVerifiedInResponse: InviteMapper.emailsMatch(
                inviteEmail,
                inviteModel.email,
              ),
              emailVerifiedInList: Boolean(
                InviteMapper.findInvitationById(listModel, invitationId),
              ),
              userAccountActive: false,
            });
          }
        }
      } finally {
        if (invitationId) {
          await api.deleteInvitation(invitationId);
        }
        validation.finalize("Auth Invite User API", responseTime);
      }
    },
  );
});
