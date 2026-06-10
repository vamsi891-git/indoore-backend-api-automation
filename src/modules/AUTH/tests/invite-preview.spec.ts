import { expect } from "@playwright/test";
import { test } from "../../../fixtures/auth.fixture";
import { InvitePublicApi } from "../Api/invite.api";
import { InviteTestData } from "../Data/invite.data";
import { InviteValidator } from "../Validator/invite.validator";
import { AuthErrorResponseSchema } from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Auth Invite Preview API", () => {
  test(
    "Validate invalid invitation preview",
    { tag: ["@smoke", "@auth", "@invite"] },
    async ({ unauthenticatedApi }) => {
      const api = new InvitePublicApi(unauthenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const preview = await api.previewInvitation(
        InviteTestData.invalidPreviewToken,
      );

      await PerformanceTracker.track(
        preview.rawResponse,
        "Auth Invite Preview API",
        `${process.env.BASE_URL}/indore/auth/invite/preview`,
        preview.responseTime,
      );

      try {
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
      } finally {
        validation.finalize("Auth Invite Preview API", preview.responseTime);
      }
    },
  );
});
