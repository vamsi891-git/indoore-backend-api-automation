import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";
import { allCommercialNegativeCases } from "../Data/commercial-negative.data";
import {
  CommercialCommonValidator,
  type CommercialErrorBody,
} from "../Validator/commercial-common.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Commercial Analysis — invalid filters are rejected", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  for (const testCase of allCommercialNegativeCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      // Single attempt — do not retry validation errors as transient 5xx.
      const { response } = await getCommercialWithRetry(
        authenticatedApi,
        testCase.path,
        { params: testCase.params },
        { maxAttempts: 1 },
      );
      const responseBody = (await response.json().catch(() => ({}))) as CommercialErrorBody;

      validation.execute("Client error status", () => {
        expect(testCase.expectedStatuses).toContain(response.status());
      });
      validation.execute("Error envelope", () =>
        CommercialCommonValidator.validateErrorEnvelope(responseBody, testCase.expectedCodes),
      );
      validation.printSummary(testCase.testName, 0);
    });
  }
});
