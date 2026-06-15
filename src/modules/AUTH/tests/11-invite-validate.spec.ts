import { expect, request } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InviteApi, InvitePublicApi } from "../Api/invite.api";
import {
  InviteTestData,
  resolveInviteE2eContext,
} from "../Data/invite.data";
import { InviteMapper } from "../Mapper/invite.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import {
  InvitePreviewResponseSchema,
  SentInvitationsListResponseSchema,
} from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { ensureSharedInviteInBeforeAll } from "../utils/invite-provision.helper";

async function createPublicApiContext() {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL missing in environment");
  }
  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });
}

/**
 * Individual invite validate flow — uses the same email token as invite-e2e:
 *   GET /indore/auth/invite/preview?token=  (INVITE_ACCEPT_TOKEN)
 *   GET /indore/auth/invitations/mine       → find invitation by ID
 */
test.describe("Auth Invite Validate Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ authenticatedApi }) => {
    await ensureSharedInviteInBeforeAll(authenticatedApi);
  });

  test(
    "Validate invite preview token from email",
    { tag: ["@auth", "@invite", "@e2e"] },
    async () => {
      const context = resolveInviteE2eContext();
      if (!context) {
        throw new Error("Invite context missing after provision step");
      }

      const publicCtx = await createPublicApiContext();
      const api = new InvitePublicApi(publicCtx);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      try {
        const preview = await api.previewInvitation(context.token);

        await PerformanceTracker.track(
          preview.rawResponse,
          "Auth Invite Validate — Preview",
          `${process.env.BASE_URL}/indore/auth/invite/preview?token=${context.token}`,
          preview.responseTime,
        );

        validation.execute("Preview Status", () =>
          assert.validateStatusCode(preview.rawResponse, 200),
        );
        validation.execute("Preview Response Time", () =>
          assert.validateResponseTime(
            preview.responseTime,
            InviteTestData.maxResponseTimeMs,
          ),
        );
        validation.execute("Preview Sensitive Data", () =>
          assert.validateSensitiveData(preview.responseBody),
        );
        validation.execute("Preview Zod", () => {
          const result = InvitePreviewResponseSchema.safeParse(
            preview.responseBody,
          );
          expect(result.success).toBe(true);
        });

        const parsed = InvitePreviewResponseSchema.parse(preview.responseBody);

        validation.execute("Preview Email And Role", () =>
          validator.validatePreviewSuccess(
            parsed,
            context.email,
            context.role,
          ),
        );

        if (context.expiresAt) {
          validation.execute("Preview Expires At Matches Invite", () =>
            expect(parsed.data.expiresAt).toBe(context.expiresAt),
          );
        }

        console.log("\n==================================================");
        console.log("INVITE PREVIEW VALIDATION");
        console.log("==================================================");
        console.log(`EMAIL FROM PREVIEW        : ${parsed.data.email}`);
        console.log(`ROLE FROM PREVIEW         : ${parsed.data.role}`);
        console.log(`EXPIRES AT                : ${parsed.data.expiresAt}`);
        console.log(`INVITATION ID (from env)  : ${context.invitationId}`);
        console.log("==================================================\n");

        validation.finalize("Auth Invite Validate — Preview", preview.responseTime);
      } finally {
        await publicCtx.dispose();
      }
    },
  );

  test(
    "Validate invitation in mine list matches preview",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      const context = resolveInviteE2eContext();
      if (!context) {
        throw new Error("Invite context missing after provision step");
      }

      const api = new InviteApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const listResponse = await api.listMyInvitations({
        page: 1,
        limit: InviteTestData.e2eListScanLimit,
        status: "pending",
      });

      try {
        validation.execute("Mine List Status", () =>
          assert.validateStatusCode(listResponse.rawResponse, 200),
        );

        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(listResponse.responseBody),
        );

        validation.execute("Invitation By ID In Mine", () =>
          validator.validateInvitationByIdInList(
            list,
            context.invitationId,
            context.email,
            context.role,
            "pending",
          ),
        );

        const item = InviteMapper.findInvitationById(list, context.invitationId)!;

        if (context.expiresAt) {
          validation.execute("Mine Expires At Matches Invite", () =>
            expect(item.expiresAt).toBe(context.expiresAt),
          );
        }

        console.log("\n==================================================");
        console.log("INVITE MINE LIST CROSS-CHECK");
        console.log("==================================================");
        console.log("EMAIL MATCHES PREVIEW     : SUCCESS");
        console.log("INVITATION BY ID FOUND    : SUCCESS");
        console.log(`STATUS                    : ${item.status}`);
        console.log(`EMAIL                     : ${item.email}`);
        console.log(`ROLE                      : ${item.role}`);
        console.log(`EXPIRES AT                : ${item.expiresAt}`);
        console.log("==================================================\n");

        validation.finalize(
          "Auth Invite Validate — Mine List",
          listResponse.responseTime,
        );
      } catch (error) {
        validation.finalize(
          "Auth Invite Validate — Mine List",
          listResponse.responseTime,
        );
        throw error;
      }
    },
  );
});
