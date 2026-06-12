import { expect, request } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InviteApi } from "../Api/invite.api";
import {
  InviteTestData,
  isAcceptSuccessStatus,
  resolveInviteAcceptPayload,
  resolveInviteE2eContext,
  resolveInviteE2eMetadata,
} from "../Data/invite.data";
import { acceptInvitationWithRetry } from "../utils/invite-provision.helper";
import {
  markInviteAcceptTokenConsumed,
  publishSuiteAcceptSnapshot,
} from "../utils/invite-token.store";
import { InviteMapper } from "../Mapper/invite.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import {
  InviteAcceptRequestSchema,
  InviteAcceptResponseSchema,
  SentInvitationsListResponseSchema,
} from "../schemas/auth.schemas";
import { AuthValidator } from "../Validator/auth.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { printInviteAcceptSummary } from "../utils/invite-accept.reporter";
import {
  INVITE_PROVISION_TEST_TIMEOUT_MS,
  prepareSharedInviteForAcceptValidate,
} from "../utils/invite-provision.helper";

async function createPublicApiContext() {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL missing in environment");
  }
  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });
}

test.describe("Auth Invite Accept Validate Flow", () => {
  test.describe.configure({
    mode: "serial",
    timeout: INVITE_PROVISION_TEST_TIMEOUT_MS,
  });

  test.beforeAll(async ({ authenticatedApi }) => {
    await prepareSharedInviteForAcceptValidate(authenticatedApi);
  });

  test(
    "Accept invitation and validate full response",
    { tag: ["@auth", "@invite", "@e2e"] },
    async () => {
      const context = resolveInviteE2eContext();
      const acceptPayload = resolveInviteAcceptPayload();
      if (!context || !acceptPayload) {
        throw new Error("Invite context missing after provision step");
      }

      const publicCtx = await createPublicApiContext();
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();
      const authValidator = new AuthValidator();

      try {
        validation.execute("Accept Request Schema", () => {
          expect(InviteAcceptRequestSchema.safeParse(acceptPayload).success).toBe(
            true,
          );
        });

        const accept = await acceptInvitationWithRetry(publicCtx, acceptPayload);

        await PerformanceTracker.track(
          accept.rawResponse,
          "Auth Invite Accept Validate",
          `${process.env.BASE_URL}/indore/auth/invite/accept`,
          accept.responseTime,
        );

        validation.execute("Accept Status", () =>
          validator.validateAcceptSuccessStatus(accept.rawResponse.status()),
        );
        validation.execute("Accept Content Type", () =>
          assert.validateContentType(accept.rawResponse),
        );
        validation.execute("Accept Response Time", () =>
          assert.validateResponseTime(
            accept.responseTime,
            InviteTestData.maxResponseTimeMs,
          ),
        );
        validation.execute("Accept Security", () =>
          authValidator.validateAuthResponseSecurity(accept.responseBody),
        );

        if (isAcceptSuccessStatus(accept.rawResponse.status())) {
          validation.execute("Accept Zod", () => {
            const result = InviteAcceptResponseSchema.safeParse(accept.responseBody);
            expect(
              result.success,
              result.success
                ? "Zod validation passed"
                : JSON.stringify(result.error?.format(), null, 2),
            ).toBe(true);
          });

          const parsed = InviteAcceptResponseSchema.parse(accept.responseBody);
          const expectedRole = context.role ?? parsed.data.user.role;

          validation.execute("Accept User Profile", () =>
            validator.validateAcceptUserProfile(
              parsed.data.user,
              context.email ?? parsed.data.user.email,
              expectedRole,
              acceptPayload,
            ),
          );
          validation.execute("Accept Session Payload", () =>
            validator.validateAcceptSessionPayload(parsed.data),
          );
          validation.execute("Accept Permissions", () =>
            validator.validateAcceptPermissions(
              parsed.data.permissions,
              parsed.data.user.role,
            ),
          );
          validation.execute("Accept Full Response", () =>
            validator.validateAcceptResponse(
              parsed,
              context.email ?? parsed.data.user.email,
              parsed.data.user.role,
              acceptPayload,
            ),
          );

          printInviteAcceptSummary({
            email: parsed.data.user.email,
            userId: parsed.data.user.id,
            role: parsed.data.user.role,
            status: parsed.data.user.status,
            permissionCount: parsed.data.permissions.length,
            tokenType: parsed.data.tokenType,
            expiresIn: parsed.data.expiresIn,
          });

          test.info().attach("accepted-user-id", {
            body: parsed.data.user.id,
            contentType: "text/plain",
          });

          publishSuiteAcceptSnapshot({
            invitationId: context.invitationId,
            email: parsed.data.user.email,
            role: parsed.data.user.role,
            userId: parsed.data.user.id,
            status: accept.rawResponse.status(),
            responseBody: accept.responseBody,
            responseTime: accept.responseTime,
          });

          markInviteAcceptTokenConsumed();
        }

        validation.finalize("Auth Invite Accept Validate", accept.responseTime);
      } finally {
        await publicCtx.dispose();
      }
    },
  );

  test(
    "Verify accepted invitation appears in mine list by ID",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      const context = resolveInviteE2eMetadata();
      if (!context) {
        throw new Error(
          "Invite metadata missing — accept step must complete before mine-list verification",
        );
      }

      const api = new InviteApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const listResponse = await api.listMyInvitations({
        page: 1,
        limit: InviteTestData.e2eListScanLimit,
        status: "accepted",
      });

      try {
        validation.execute("Mine Accepted Status", () =>
          assert.validateStatusCode(listResponse.rawResponse, 200),
        );

        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(listResponse.responseBody),
        );

        validation.execute("Accepted Invitation By ID", () =>
          validator.validateInvitationByIdInList(
            list,
            context.invitationId,
            context.email,
            context.role,
            "accepted",
          ),
        );

        const item = InviteMapper.findInvitationById(list, context.invitationId)!;
        validation.execute("Accepted At Set", () => {
          expect(item.acceptedAt).toBeTruthy();
        });
      } finally {
        validation.finalize(
          "Auth Invite Accept — Mine Accepted",
          listResponse.responseTime,
        );
      }
    },
  );
});
