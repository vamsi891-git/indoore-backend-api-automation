import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerCategoryDistributionApi } from "../Api/consumercategorydistribution.api";
import {
  consumerCategoryDistributionMaxResponseTimeMs,
  consumerCategoryDistributionTestCases,
  resolveConsumerCategoryDistributionContractBody,
  resolveConsumerCategoryDistributionQuery,
} from "../Data/consumercategorydistribution.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  ConsumerCategoryDistributionMapper,
  type ConsumerCategoryDistributionErrorResponse,
} from "../Mapper/consumercategorydistribution.mapper";
import { ConsumerCategoryDistributionValidator } from "../Validator/consumercategorydistribution.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const CATEGORY_DISTRIBUTION_PATH = "/indore/dashboard/consumer/category-distribution";

test.describe("Dashboard — consumers by category", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of consumerCategoryDistributionTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new ConsumerCategoryDistributionValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveConsumerCategoryDistributionContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing consumer category-distribution contract body");
          return;
        }

        const mapped = ConsumerCategoryDistributionMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new ConsumerCategoryDistributionApi(authenticatedApi);
      const query = resolveConsumerCategoryDistributionQuery(testCase.scenario);

      const { rawResponse, responseBody, responseTime } =
        await api.getConsumerCategoryDistribution(query);

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, consumerCategoryDistributionMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = ConsumerCategoryDistributionMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("Category Distribution Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, query),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Consumers by category — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@consumer-category-distribution"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new ConsumerCategoryDistributionValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(CATEGORY_DISTRIBUTION_PATH, {
          headers: authCase.headers,
          params: { category: "Residential", page: 1, limit: 20 },
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `Consumer category-distribution ${authCase.testName}`,
          )
        ) {
          authTest.skip(true, `Rate limited (429) on ${CATEGORY_DISTRIBUTION_PATH} — retry later`);
          return;
        }
        const responseBody = (await rawResponse
          .json()
          .catch(() => ({}))) as ConsumerCategoryDistributionErrorResponse;
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `Consumer category-distribution ${authCase.expectedErrorCode}`,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status (auth negative)", () =>
          assert.validateStatusCode(rawResponse, authCase.expectedStatus, responseBody),
        );
        validation.execute("Content Type", () => assert.validateContentType(rawResponse));
        validation.execute("Auth Error Envelope", () => {
          if (authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode) {
            validator.validateUnauthorizedError(responseBody);
          } else if (authCase.expectedErrorCode === dtrUnbalanceAccessTokenInvalidCode) {
            validator.validateAccessTokenInvalidError(responseBody);
          } else {
            validator.validateAuthError(
              responseBody,
              authCase.expectedErrorCode,
              authCase.expectedMessage,
            );
          }
        });

        validation.printSummary(
          `Consumer Category Distribution — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
