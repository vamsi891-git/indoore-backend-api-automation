import { expect } from "@playwright/test";
import { test } from "../../../fixtures/auth.fixture";
import { AuthenticationApi } from "../Api/auth.api";
import { AuthTestData } from "../Data/auth.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import { AuthValidator } from "../Validator/auth.validator";
import { AuthRefreshSuccessResponseSchema } from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { TokenManager } from "../../../core/utils/token-manager";

test.describe("Auth Refresh API", () => {
  test(
    "Validate token refresh",
    { tag: ["@smoke", "@auth"] },
    async ({ unauthenticatedApi }) => {
      test.skip(
        !AuthTestData.hasValidCredentials,
        "EMAIL/USERNAME and PASSWORD required in .env",
      );

      const api = new AuthenticationApi(unauthenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      const establishedSession = await api.loginUntilSession(
        AuthTestData.validEmail,
        AuthTestData.validPassword,
      );
      const beforeSession = AuthMapper.mapLoginSession(
        establishedSession,
        establishedSession.csrfToken,
      );

      const csrfToken = establishedSession.csrfToken;
      validation.execute("Refresh CSRF", () =>
        validator.validateCsrfToken(csrfToken),
      );

      const refresh = await api.postRefreshWithCookies(csrfToken);

      await PerformanceTracker.track(
        refresh.rawResponse,
        "Auth Refresh API",
        `${process.env.BASE_URL}${AuthTestData.paths.refresh}`,
        refresh.responseTime,
      );

      try {
        validation.execute("Refresh Status", () =>
          assert.validateStatusCode(
            refresh.rawResponse,
            200,
            refresh.responseBody,
          ),
        );
        validation.execute("Refresh Content Type", () =>
          assert.validateContentType(refresh.rawResponse),
        );
        validation.execute("Refresh Response Time", () =>
          assert.validateResponseTime(
            refresh.responseTime,
            AuthTestData.maxResponseTimeMs,
          ),
        );
        validation.execute("Refresh Security", () =>
          validator.validateAuthResponseSecurity(refresh.responseBody),
        );

        if (refresh.rawResponse.status() === 200) {
          validation.execute("Refresh Zod", () => {
            const result = AuthRefreshSuccessResponseSchema.safeParse(
              refresh.responseBody,
            );
            expect(
              result.success,
              result.success
                ? "Zod validation passed"
                : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
            ).toBe(true);
          });

          const parsed = AuthRefreshSuccessResponseSchema.parse(
            refresh.responseBody,
          );
          const afterSession = AuthMapper.mapLoginSession(
            parsed.data,
            csrfToken,
          );

          validation.execute("Refresh Session", () =>
            validator.validateRefreshSession(beforeSession, afterSession),
          );
          validation.execute("Refresh Token Type", () =>
            validator.validateRefreshTokenType(parsed.data),
          );

          TokenManager.seed(
            afterSession.accessToken,
            afterSession.expiresIn,
            afterSession.csrfToken,
          );
        }
      } finally {
        validation.finalize("Auth Refresh API", refresh.responseTime);
      }
    },
  );
});
