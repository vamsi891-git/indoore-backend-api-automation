import { test } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { AuthenticationApi } from "../Api/auth.api";
import { AuthTestData } from "../Data/auth.data";
import { AuthValidator } from "../Validator/auth.validator";

test.describe("Auth Session — Negative", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "GET /auth/me — without authentication returns 401",
    { tag: ["@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      const rawResponse = await unauthenticatedApi.get(AuthTestData.paths.me);
      const responseBody = await rawResponse.json().catch(() => ({}));
      const responseTime = 0;

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(
          rawResponse,
          AuthTestData.expectedUnauthorizedStatus,
          responseBody,
        ),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorEnvelope(
          rawResponse.status(),
          responseBody,
          [AuthTestData.expectedUnauthorizedStatus],
        ),
      );

      validation.printSummary("Auth Me — Unauthorized", responseTime);
    },
  );

  test(
    "GET /auth/devices — without authentication returns 401",
    { tag: ["@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      const rawResponse = await unauthenticatedApi.get(AuthTestData.paths.devices);
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(
          rawResponse,
          AuthTestData.expectedUnauthorizedStatus,
          responseBody,
        ),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorEnvelope(
          rawResponse.status(),
          responseBody,
          [AuthTestData.expectedUnauthorizedStatus],
        ),
      );

      validation.printSummary("Auth Devices — Unauthorized", 0);
    },
  );

  test(
    "POST /auth/refresh — missing CSRF token returns 403",
    { tag: ["@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      test.skip(
        !AuthTestData.hasValidCredentials,
        "EMAIL/USERNAME and PASSWORD required in .env",
      );

      const api = new AuthenticationApi(unauthenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      await api.loginUntilSession(
        AuthTestData.validEmail,
        AuthTestData.validPassword,
      );

      const rawResponse = await unauthenticatedApi.post(AuthTestData.paths.refresh, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (csrf missing)", () =>
        assert.validateStatusCode(
          rawResponse,
          AuthTestData.expectedCsrfMissingStatus,
          responseBody,
        ),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorEnvelope(
          rawResponse.status(),
          responseBody,
          [AuthTestData.expectedCsrfMissingStatus],
          AuthTestData.expectedCsrfMissingCode,
        ),
      );

      validation.printSummary("Auth Refresh — Missing CSRF", 0);
    },
  );

  test(
    "POST /auth/refresh — without session cookies returns 401",
    { tag: ["@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      const preflight = await unauthenticatedApi.get(AuthTestData.paths.login);
      const cookies = (await unauthenticatedApi.storageState()).cookies;
      const csrfToken = cookies.find((cookie) => cookie.name === "csrf_token")?.value;

      if (!csrfToken) {
        test.skip(true, "CSRF cookie unavailable for refresh negative probe");
      }

      const rawResponse = await unauthenticatedApi.post(AuthTestData.paths.refresh, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken!,
          Cookie: `csrf_token=${csrfToken}`,
        },
      });
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (no refresh cookie)", () =>
        assert.validateStatusCode(
          rawResponse,
          AuthTestData.expectedUnauthorizedStatus,
          responseBody,
        ),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorEnvelope(
          rawResponse.status(),
          responseBody,
          [AuthTestData.expectedUnauthorizedStatus],
        ),
      );

      validation.printSummary("Auth Refresh — No Session", 0);
      void preflight;
    },
  );
});
