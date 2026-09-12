import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerOemDistributionApi } from "../Api/consumeroemdistribution.api";
import {
  consumerOemDistributionMaxResponseTimeMs,
  consumerOemDistributionTestCases,
  resolveConsumerOemDistributionContractBody,
  resolveConsumerOemDistributionQuery,
} from "../Data/consumeroemdistribution.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  ConsumerOemDistributionMapper,
  type ConsumerOemDistributionErrorResponse,
} from "../Mapper/consumeroemdistribution.mapper";
import { ConsumerOemDistributionValidator } from "../Validator/consumeroemdistribution.validator";

const OEM_DISTRIBUTION_PATH = "/indore/dashboard/consumer/oem-distribution";

test.describe("Dashboard — consumers by meter make", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of consumerOemDistributionTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new ConsumerOemDistributionValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveConsumerOemDistributionContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(
              true,
              "Missing consumer oem-distribution contract body",
            );
            return;
          }

          const mapped = ConsumerOemDistributionMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new ConsumerOemDistributionApi(authenticatedApi);
        const query = resolveConsumerOemDistributionQuery(testCase.scenario);

        const { rawResponse, responseBody, responseTime } =
          await api.getConsumerOemDistribution(query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(
            rawResponse,
            expectedStatus,
            responseBody,
          ),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            consumerOemDistributionMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = ConsumerOemDistributionMapper.map(responseBody);
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("OEM Distribution Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, query),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});

authTest.describe("Consumers by meter make — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@consumer-oem-distribution"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new ConsumerOemDistributionValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(
          OEM_DISTRIBUTION_PATH,
          {
            headers: authCase.headers,
            params: { oem: "L&T", page: 1, limit: 20 },
          },
        );
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `Consumer oem-distribution ${authCase.testName}`,
          )
        ) {
          authTest.skip(
            true,
            `Rate limited (429) on ${OEM_DISTRIBUTION_PATH} — retry later`,
          );
          return;
        }
        const responseBody = (await rawResponse
          .json()
          .catch(() => ({}))) as ConsumerOemDistributionErrorResponse;
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `Consumer oem-distribution ${authCase.expectedErrorCode}`,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status (auth negative)", () =>
          assert.validateStatusCode(
            rawResponse,
            authCase.expectedStatus,
            responseBody,
          ),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Auth Error Envelope", () => {
          if (authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode) {
            validator.validateUnauthorizedError(responseBody);
          } else if (
            authCase.expectedErrorCode === dtrUnbalanceAccessTokenInvalidCode
          ) {
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
          `Consumer OEM Distribution — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
