import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { getConsumptionWithRetry } from "../utils/consumption-request.helper";
import {consumptionReportNegativeCases,monthlyNetMeterNegativeCases,patternConsumptionNegativeCases,} from "../Data/consumption-negative.data";
import {ConsumptionCommonValidator,type ConsumptionErrorBody,} from "../Validator/consumption-common.validator";
import { ValidationEngine } from "../../../core/engine/validation.engine";
const allNegativeCases = [
  ...patternConsumptionNegativeCases,
  ...monthlyNetMeterNegativeCases,
  ...consumptionReportNegativeCases,
];
test.describe("Consumption API — Negative", () => {
  for (const testCase of allNegativeCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const validation = new ValidationEngine();
        const { response } = await getConsumptionWithRetry(
          authenticatedApi,
          testCase.path,
          { params: testCase.params },
        );
        const responseBody = (await response.json().catch(() => ({}))) as ConsumptionErrorBody;

        validation.execute("Client error status", () => {
          expect(testCase.expectedStatuses).toContain(response.status());
        });
        validation.execute("Error envelope", () =>
          ConsumptionCommonValidator.validateErrorEnvelope(
            responseBody,
            testCase.expectedCodes,
          ),
        );
        validation.printSummary(testCase.testName, 0);
      },
    );
  }
});
