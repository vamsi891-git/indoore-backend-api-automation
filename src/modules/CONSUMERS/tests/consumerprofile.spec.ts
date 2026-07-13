import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerProfileApi } from "../Api/consumerprofile.api";
import {
  consumerProfileMaxResponseTimeMs,
  consumerProfileTestCases,
  resolveConsumerProfileQuery,
  resolveConsumerProfileRef,
} from "../Data/consumerprofile.data";
import {
  ConsumerProfileMapper,
  type ConsumerProfileErrorResponse,
} from "../Mapper/consumerprofile.mapper";
import { ConsumerProfileValidator } from "../Validator/consumerprofile.validator";

test.describe("Consumer Profile API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of consumerProfileTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const api = new ConsumerProfileApi(authenticatedApi);
        const validator = new ConsumerProfileValidator();
        const consumerRef = resolveConsumerProfileRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve consumer profile route ref");
          return;
        }

        const query = resolveConsumerProfileQuery(testCase.scenario);
        const {
          rawResponse,
          responseBody,
          responseTime,
        } = await api.getConsumerProfile(consumerRef, query);

        await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            consumerProfileMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as ConsumerProfileErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = ConsumerProfileMapper.map(responseBody);
        const identityOptions =
          testCase.scenario === "profile_found" ||
          testCase.scenario === "profile_no_query"
            ? { routeRef: consumerRef, expectedUniqueId: consumerRef }
            : testCase.scenario === "profile_by_ivrs"
              ? { routeRef: consumerRef, expectedConsumerNumber: consumerRef }
              : { routeRef: consumerRef };

        validation.execute("Profile Scenario", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            identityOptions,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
