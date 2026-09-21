import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { test } from "../../../fixtures/api.fixture";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { AuditLogsInvalidQueries, auditLogsPath } from "../Data/auditlogs.data";
import { AuditLogsValidator } from "../Validator/auditlogs.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Audit Logs — Negative", () => {
  test.describe.configure({ mode: "serial" });

  for (const row of AuditLogsInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@audit-logs"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          `${auditLogsPath}?${row.query}`,
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          AuditLogsValidator.validateErrorResponse(status, responseBody, [...row.expectedStatus]),
        );
        validation.printSummary(row.testName, 0);
      },
    );
  }
});

test.describe("Audit Logs — Edge", () => {
  test.describe.configure({ mode: "serial" });

  for (const row of AuditLogsInvalidQueries) {
    test(row.testName, { tag: ["@edge", "@audit-logs"] }, async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        `${auditLogsPath}?${row.query}`,
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      const status = rawResponse.status();

      validation.execute("Status", () => {
        expect(row.expectedStatus).toContain(status);
      });
      validation.execute("Error envelope", () =>
        AuditLogsValidator.validateErrorResponse(status, responseBody, [...row.expectedStatus]),
      );
      validation.printSummary(row.testName, 0);
    });
  }
});

authTest.describe("Audit Logs — Auth Negative", () => {
  authTest(
    "GET /users/audit-logs — without auth returns 401",
    { tag: ["@negative", "@audit-logs", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const rawResponse = await unauthenticatedApi.get(
        `${auditLogsPath}?page=1&limit=20&sort=createdAt_desc`,
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AuditLogsValidator.validateErrorResponse(rawResponse.status(), responseBody, [401]),
      );
      validation.printSummary("Audit Logs — Unauthorized", 0);
    },
  );
});
