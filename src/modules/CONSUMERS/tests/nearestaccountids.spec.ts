import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { NearestAccountIdsApi } from "../Api/nearestaccountids.api";
import {
  nearestAccountIdsDefaultAccountId,
  nearestAccountIdsMaxResponseTimeMs,
  nearestAccountIdsTestCases,
  resolveNearestAccountIdsQuery,
} from "../Data/nearestaccountids.data";
import { NearestAccountIdsMapper } from "../Mapper/nearestaccountids.mapper";
import { NearestAccountIdsValidator } from "../Validator/nearestaccountids.validator";

test.describe("Nearest Account IDs API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of nearestAccountIdsTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const api = new NearestAccountIdsApi(authenticatedApi);
        const validator = new NearestAccountIdsValidator();

        if (testCase.scenario === "missing_account_id") {
          const { rawResponse, responseBody, responseTime } =
            await api.getNearestAccountIdsRaw();

          await PerformanceTracker.track(
            rawResponse,
            testCase.testName,
            rawResponse.url(),
            responseTime,
          );

          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
          validation.execute("Status Validation", () =>
            assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
          );
          validation.execute("Validation Error", () =>
            validator.validateValidationError(responseBody, "accountId"),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "empty_account_id") {
          const { rawResponse, responseBody, responseTime } =
            await api.getNearestAccountIdsRaw({ accountId: "", limit: 10 });

          await PerformanceTracker.track(
            rawResponse,
            testCase.testName,
            rawResponse.url(),
            responseTime,
          );

          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
          validation.execute("Status Validation", () =>
            assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
          );
          validation.execute("Validation Error", () =>
            validator.validateValidationError(responseBody, "accountId"),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "invalid_limit_zero") {
          const { rawResponse, responseBody, responseTime } =
            await api.getNearestAccountIdsRaw({
              accountId: nearestAccountIdsDefaultAccountId,
              limit: 0,
            });

          await PerformanceTracker.track(
            rawResponse,
            testCase.testName,
            rawResponse.url(),
            responseTime,
          );

          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
          validation.execute("Status Validation", () =>
            assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
          );
          validation.execute("Validation Error", () =>
            validator.validateValidationError(responseBody, "limit"),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "invalid_limit_max") {
          const { rawResponse, responseBody, responseTime } =
            await api.getNearestAccountIdsRaw({
              accountId: nearestAccountIdsDefaultAccountId,
              limit: 100,
            });

          await PerformanceTracker.track(
            rawResponse,
            testCase.testName,
            rawResponse.url(),
            responseTime,
          );

          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
          validation.execute("Status Validation", () =>
            assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
          );
          validation.execute("Validation Error", () =>
            validator.validateValidationError(responseBody, "limit"),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        const query = resolveNearestAccountIdsQuery(testCase.scenario);
        if (!query?.accountId) {
          test.skip(true, "Could not resolve nearest-account-ids query");
          return;
        }

        const { rawResponse, responseBody, responseTime } =
          await api.getNearestAccountIds(query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const mapped = NearestAccountIdsMapper.map(responseBody);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            nearestAccountIdsMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        validation.execute("Response", () => validator.validateResponse(mapped));
        validation.execute("Root Structure", () =>
          validator.validateRootStructure(mapped.data),
        );
        validation.execute("Numeric Suffix Type", () =>
          validator.validateNumericSuffixType(mapped.data),
        );
        validation.execute("Max Distance Type", () =>
          validator.validateMaxDistanceType(mapped.data),
        );
        validation.execute("Nearest Account IDs Shape", () =>
          validator.validateNearestAccountIdsShape(mapped.data),
        );
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            query.accountId,
            query.limit,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
