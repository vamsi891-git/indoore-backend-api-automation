import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
  EnergyAuditInvalidQueries,
  EnergyAuditUnauthorizedCases,
} from "../Data/energy-audits-negative.data";
import { EnergyAuditsCommonValidator } from "../Validator/energy-audits-common.validator";

test.describe("Energy Audits — Negative", () => {
  for (const row of EnergyAuditInvalidQueries) {
    test(
      row.testName,
      { tag: ["@negative", "@energy-audit", "@edge"] },
      async ({ authenticatedApi }) => {
        const validation = new ValidationEngine();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          `${row.path}?${row.query}`,
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          EnergyAuditsCommonValidator.validateErrorResponse(
            status,
            responseBody,
            [...row.expectedStatus],
          ),
        );
        validation.printSummary(row.testName, 0);
      },
    );
  }

  for (const row of EnergyAuditUnauthorizedCases) {
    authTest(
      row.testName,
      { tag: ["@negative", "@energy-audit", "@auth"] },
      async ({ unauthenticatedApi }) => {
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const rawResponse = await unauthenticatedApi.get(
          `${row.path}?${row.query}`,
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        validation.execute("Status (unauthorized)", () =>
          assert.validateStatusCode(rawResponse, 401, responseBody),
        );
        validation.execute("Error envelope", () =>
          EnergyAuditsCommonValidator.validateErrorResponse(
            rawResponse.status(),
            responseBody,
            [401],
          ),
        );
        validation.printSummary(row.testName, 0);
      },
    );
  }
});
