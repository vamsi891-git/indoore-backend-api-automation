import { expect } from "@playwright/test";
import { test } from "../../../fixtures/auth.fixture";
import { AuthenticationApi } from "../Api/auth.api";
import { AuthTestData } from "../Data/auth.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import { AuthValidator } from "../Validator/auth.validator";
import {
  AuthErrorResponseSchema,
  AuthLoginSuccessResponseSchema,
} from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Auth Login API", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "Validate CSRF preflight and login flows",
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

      const preflight = await api.getLoginPreflight();

      await PerformanceTracker.track(
        preflight.rawResponse,
        "Auth CSRF Preflight",
        `${process.env.BASE_URL}${AuthTestData.paths.login}`,
        preflight.responseTime,
      );

      try {
        validation.execute("Preflight Response Time", () =>
          assert.validateResponseTime(
            preflight.responseTime,
            AuthTestData.maxResponseTimeMs,
          ),
        );

        const csrfToken = await AuthMapper.resolveCsrfToken(
          unauthenticatedApi,
          preflight.rawResponse.headers(),
        );
        validation.execute("CSRF Token Available", () =>
          validator.validateCsrfToken(csrfToken),
        );

        const invalidLogin = await api.postLogin(
          AuthTestData.validEmail,
          AuthTestData.invalidPassword,
          csrfToken,
        );

        validation.execute("Invalid Login Status", () =>
          validator.validateInvalidCredentials(
            invalidLogin.rawResponse.status(),
            AuthTestData.expectedInvalidCredentialsStatus,
            invalidLogin.responseBody,
            AuthTestData.expectedInvalidCredentialsCode,
          ),
        );

        validation.execute("Invalid Login Zod", () => {
          const result = AuthErrorResponseSchema.safeParse(
            invalidLogin.responseBody,
          );
          expect(result.success).toBe(true);
        });

        validation.execute("Invalid Login Sensitive Data", () =>
          assert.validateSensitiveData(invalidLogin.responseBody),
        );

        const freshCsrf = await AuthMapper.resolveCsrfToken(
          unauthenticatedApi,
          (await api.getLoginPreflight()).rawResponse.headers(),
        );

        const validLogin = await api.postLogin(
          AuthTestData.validEmail,
          AuthTestData.validPassword,
          freshCsrf,
        );

        await PerformanceTracker.track(
          validLogin.rawResponse,
          "Auth Login API",
          `${process.env.BASE_URL}${AuthTestData.paths.login}`,
          validLogin.responseTime,
        );

        validation.execute("Valid Login Status", () =>
          assert.validateStatusCode(
            validLogin.rawResponse,
            200,
            validLogin.responseBody,
          ),
        );
        validation.execute("Valid Login Content Type", () =>
          assert.validateContentType(validLogin.rawResponse),
        );
        validation.execute("Valid Login Response Time", () =>
          assert.validateResponseTime(
            validLogin.responseTime,
            AuthTestData.maxResponseTimeMs,
          ),
        );
        validation.execute("Valid Login Security", () =>
          validator.validateAuthResponseSecurity(validLogin.responseBody),
        );

        if (validLogin.rawResponse.status() === 200) {
          validation.execute("Valid Login Zod", () => {
            const result = AuthLoginSuccessResponseSchema.safeParse(
              validLogin.responseBody,
            );
            expect(
              result.success,
              result.success
                ? "Zod validation passed"
                : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
            ).toBe(true);
          });

          validation.execute("Valid Login Payload", () => {
            const body = validLogin.responseBody as {
              data?: unknown;
            };
            validator.validateLoginPayloadShape(body.data);
          });

          const parsed = AuthLoginSuccessResponseSchema.parse(
            validLogin.responseBody,
          );

          if (AuthMapper.hasDirectSession(parsed.data)) {
            const session = AuthMapper.mapLoginSession(
              parsed.data,
              csrfToken,
            );
            validation.execute("Direct Login Session", () =>
              validator.validateLoginSession(session),
            );
          } else {
            const selection = AuthMapper.mapDeviceSelection(parsed.data);
            validation.execute("Device Selection Payload", () =>
              validator.validateDeviceSelection(selection!),
            );
          }
        }
      } finally {
        validation.finalize("Auth Login API", preflight.responseTime);
      }
    },
  );
});
