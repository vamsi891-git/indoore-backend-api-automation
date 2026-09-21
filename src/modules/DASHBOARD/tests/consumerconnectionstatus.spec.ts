import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerConnectionStatusApi } from "../Api/consumerconnectionstatus.api";
import {
  consumerConnectionStatusMaxResponseTimeMs,
  consumerConnectionStatusTestCases,
  resolveConsumerConnectionStatusContractBody,
  resolveConsumerConnectionStatusQuery,
} from "../Data/consumerconnectionstatus.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  ConsumerConnectionStatusMapper,
  type ConsumerConnectionStatusErrorResponse,
} from "../Mapper/consumerconnectionstatus.mapper";
import { ConsumerConnectionStatusValidator } from "../Validator/consumerconnectionstatus.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const CONNECTION_STATUS_PATH = "/indore/dashboard/consumer/connection-status";

test.describe("Dashboard — consumers by connection status", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of consumerConnectionStatusTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new ConsumerConnectionStatusValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveConsumerConnectionStatusContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing consumer connection-status contract body");
          return;
        }

        const mapped = ConsumerConnectionStatusMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new ConsumerConnectionStatusApi(authenticatedApi);
      const query = resolveConsumerConnectionStatusQuery(testCase.scenario);

      const { rawResponse, responseBody, responseTime } =
        await api.getConsumerConnectionStatus(query);

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
        assert.validateResponseTime(responseTime, consumerConnectionStatusMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = ConsumerConnectionStatusMapper.map(responseBody);
      validation.execute("Response Envelope", () =>
        validator.validateResponseEnvelope(responseBody),
      );
      validation.execute("Connection Status Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, query),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Consumers by connection status — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@consumer-connection-status"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new ConsumerConnectionStatusValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(CONNECTION_STATUS_PATH, {
          headers: authCase.headers,
          params: { status: "connected", page: 1, limit: 20 },
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `Consumer connection-status ${authCase.testName}`,
          )
        ) {
          authTest.skip(true, `Rate limited (429) on ${CONNECTION_STATUS_PATH} — retry later`);
          return;
        }
        const responseBody = (await rawResponse
          .json()
          .catch(() => ({}))) as ConsumerConnectionStatusErrorResponse;
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `Consumer connection-status ${authCase.expectedErrorCode}`,
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
          `Consumer Connection Status — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
