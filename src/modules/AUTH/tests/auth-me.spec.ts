import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { AuthSessionApi } from "../Api/auth-session.api";
import { AuthTestData } from "../Data/auth.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import { AuthValidator } from "../Validator/auth.validator";
import { AuthMeResponseSchema } from "../schemas/auth.schemas";

test.describe("Auth Me API", () => {
  test(
    "Validate GET /auth/me — current session profile",
    { tag: ["@smoke", "@auth"] },
    async ({ authenticatedApi }) => {
      const api = new AuthSessionApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      const { rawResponse, responseBody, responseTime } = await api.getMe();

      await PerformanceTracker.track(
        rawResponse,
        "Auth Me API",
        rawResponse.url(),
        responseTime
      );

      validation.execute("Me Status Code", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Me Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Me Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          AuthTestData.maxResponseTimeMs,
        ),
      );
      validation.execute("Me Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.execute("Me Security", () =>
        validator.validateAuthResponseSecurity(responseBody),
      );
      validation.execute("Me Success Envelope", () =>
        validator.validateSuccessEnvelope(responseBody),
      );

      validation.execute("Me Zod Contract", () => {
        const result = AuthMeResponseSchema.safeParse(responseBody);
        expect(
          result.success,
          result.success
            ? "Zod validation passed"
            : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
        ).toBe(true);
      });

      const meData = AuthMapper.mapMe(responseBody);
      validation.execute("Me User Rules", () =>
        validator.validateMeUser(meData.user),
      );
      validation.execute("Me Permissions", () =>
        validator.validateMePermissions(meData.permissions),
      );
      validation.execute("Me Session Flags", () =>
        validator.validateMeSessionFlags(meData),
      );

      validation.printSummary("Auth Me API", responseTime);
    },
  );
});
