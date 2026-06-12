import { expect, request } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InvitePublicApi } from "../Api/invite.api";
import {
  InviteTestData,
  resolveInviteAcceptToken,
  resolveInviteE2eContext,
} from "../Data/invite.data";
import { InvitePreviewResponseSchema } from "../schemas/auth.schemas";
import { InviteValidator } from "../Validator/invite.validator";
import { AuthErrorResponseSchema } from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { ensureSharedInviteTokenForAuthSuite } from "../utils/invite-provision.helper";

async function createPublicApiContext() {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL missing in environment");
  }
  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });
}

test.describe("Auth Invite Preview API", () => {
  test(
    "Validate invalid invitation preview",
    { tag: ["@smoke", "@auth", "@invite"] },
    async () => {
      const publicCtx = await createPublicApiContext();
      const api = new InvitePublicApi(publicCtx);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      try {
        const preview = await api.previewInvitation(
          InviteTestData.invalidPreviewToken,
        );

        await PerformanceTracker.track(
          preview.rawResponse,
          "Auth Invite Preview API",
          `${process.env.BASE_URL}/indore/auth/invite/preview`,
          preview.responseTime,
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
        validation.execute("Invalid Preview Contract", () =>
          validator.validatePreviewInvalid(
            preview.rawResponse.status(),
            preview.responseBody,
            InviteTestData.previewErrorCodes.invalid,
          ),
        );
        validation.execute("Invalid Preview Zod", () => {
          const result = AuthErrorResponseSchema.safeParse(preview.responseBody);
          expect(result.success).toBe(true);
          expect(result.data?.error.code).toBe(
            InviteTestData.previewErrorCodes.invalid,
          );
        });

        validation.finalize("Auth Invite Preview API (invalid)", preview.responseTime);
      } finally {
        await publicCtx.dispose();
      }
    },
  );

  test.describe("Valid preview from email token", () => {
    test.beforeAll(async ({ authenticatedApi }) => {
      await ensureSharedInviteTokenForAuthSuite(authenticatedApi);
    });

    test(
      "Validate valid invitation preview from email token",
      { tag: ["@auth", "@invite", "@e2e"] },
      async () => {
        const context = resolveInviteE2eContext();
        const token = resolveInviteAcceptToken();
        if (!token) {
          throw new Error("Invite token missing after provision step");
        }

        const publicCtx = await createPublicApiContext();
        const api = new InvitePublicApi(publicCtx);
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new InviteValidator();

        try {
          const preview = await api.previewInvitation(token);

          await PerformanceTracker.track(
            preview.rawResponse,
            "Auth Invite Preview API (valid)",
            `${process.env.BASE_URL}/indore/auth/invite/preview?token=${token}`,
            preview.responseTime,
          );

          validation.execute("Valid Preview Status", () =>
            assert.validateStatusCode(preview.rawResponse, 200),
          );
          validation.execute("Valid Preview Zod", () => {
            const result = InvitePreviewResponseSchema.safeParse(
              preview.responseBody,
            );
            expect(result.success).toBe(true);
          });

          const parsed = InvitePreviewResponseSchema.parse(preview.responseBody);

          if (context) {
            validation.execute("Valid Preview Email", () =>
              validator.validatePreviewSuccess(
                parsed,
                context.email,
                context.role,
              ),
            );
            if (context.expiresAt) {
              validation.execute("Valid Preview Expires At", () =>
                expect(parsed.data.expiresAt).toBe(context.expiresAt),
              );
            }
          } else {
            validation.execute("Valid Preview Email Format", () => {
              expect(parsed.data.email).toContain("@");
              expect(parsed.data.role.trim().length).toBeGreaterThan(0);
              expect(new Date(parsed.data.expiresAt).getTime()).toBeGreaterThan(
                Date.now(),
              );
            });
          }

          validation.finalize(
            "Auth Invite Preview API (valid)",
            preview.responseTime,
          );
        } finally {
          await publicCtx.dispose();
        }
      },
    );
  });
});
