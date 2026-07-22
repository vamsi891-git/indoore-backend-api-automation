import { test } from "../../../fixtures/api.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { REVENUE_PROTECTION_ABERRATIONS_PATH } from "../Api/aberrations.api";
import { aberrationsNegativeCases } from "../Data/aberrations-negative.data";
import {RevenueCommonValidator,type RevenueErrorBody,} from "../Validator/revenue-common.validator";
import {buildRevenueProtectionUrl,getRevenueProtectionWithRetry,} from "../utils/revenue-protection-request.helper";
test.describe("Revenue Protection — Aberrations Negative", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  for (const negativeCase of aberrationsNegativeCases) {
    test(
      negativeCase.testName,
      { tag: negativeCase.tags },
      async ({ authenticatedApi }) => {
        const validation = new ValidationEngine();
        const { response: rawResponse } = await getRevenueProtectionWithRetry(
          authenticatedApi,
          buildRevenueProtectionUrl(
            REVENUE_PROTECTION_ABERRATIONS_PATH,
            negativeCase.params,
          ),
        );
        const body = (await rawResponse
          .json()
          .catch(() => ({}))) as RevenueErrorBody;
        validation.execute("Expected status", () => {
          if (!negativeCase.expectedStatuses.includes(rawResponse.status())) {
            throw new Error(
              `Expected one of ${negativeCase.expectedStatuses.join(", ")} but got ${rawResponse.status()}`,
            );
          }
        });
        if (negativeCase.outcome === "hard-reject") {
          validation.execute("Rejected with error envelope", () =>
            RevenueCommonValidator.validateErrorEnvelope(
              rawResponse.status(),
              body,
            ),
          );
        } else {
          validation.execute("Empty success grid", () =>
            RevenueCommonValidator.validateEmptySuccessGrid(
              rawResponse.status(),
              body,
            ),
          );
        }
        validation.printSummary(negativeCase.testName, 0);
      },
    );
  }
});
