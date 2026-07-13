import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ActivationApi } from "../Api/activation.api";
import {
  activationMaxResponseTimeMs,
  activationTestCases,
  resolveActivationConsumerId,
} from "../Data/activation.data";
import {
  ActivationMapper,
  type ActivationErrorResponse,
} from "../Mapper/activation.mapper";
import { ActivationValidator } from "../Validator/activation.validator";

test.describe("Consumer Activation API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of activationTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const api = new ActivationApi(authenticatedApi);
        const validator = new ActivationValidator();
        const consumerId = resolveActivationConsumerId(testCase.scenario);

        if (!consumerId) {
          test.skip(true, "Could not resolve activation consumer id");
          return;
        }

        if (testCase.scenario === "missing_status") {
          const { rawResponse, responseBody, responseTime } =
            await api.patchActivationRaw(consumerId, {});

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
            validator.validateValidationError(responseBody, "status"),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "invalid_status" ||
          testCase.scenario === "empty_status"
        ) {
          const { rawResponse, responseBody, responseTime } =
            await api.patchActivationRaw(consumerId, {
              status: testCase.invalidStatus,
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
            validator.validateValidationError(responseBody, "status"),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "consumer_not_found" ||
          testCase.scenario === "meter_route_rejected"
        ) {
          const requestStatus = testCase.requestStatus ?? "active";
          const { rawResponse, responseBody, responseTime } =
            await api.updateActivation(consumerId, { status: requestStatus });

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
          validation.execute("Consumer Not Found", () =>
            validator.validateConsumerNotFound(
              responseBody as unknown as ActivationErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        const requestStatus = testCase.requestStatus;
        if (!requestStatus) {
          test.skip(true, "Missing request status for activation scenario");
          return;
        }

        try {
          const { rawResponse, responseBody, responseTime } =
            await api.updateActivation(consumerId, { status: requestStatus });

          await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
          const mapped = ActivationMapper.map(responseBody);
          const { consumer } = mapped;

          validation.execute("Status Validation", () =>
            assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
          );
          validation.execute("Content Validation", () =>
            assert.validateContentType(rawResponse),
          );
          validation.execute("Response Time", () =>
            assert.validateResponseTime(
              responseTime,
              activationMaxResponseTimeMs,
            ),
          );
          validation.execute("Security Validation", () =>
            assert.validateSensitiveData(responseBody),
          );
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, ["success", "data"]),
          );
          validation.execute("Response", () => validator.validateResponse(responseBody));
          validation.execute("Root Structure", () =>
            validator.validateRootStructure(mapped),
          );
          validation.execute("Data Required Fields", () =>
            assert.validateRequiredFields(responseBody.data, [
              "consumer",
              "previousStatus",
            ]),
          );
          validation.execute("Consumer Required Fields", () =>
            validator.validateConsumerRequiredFields(consumer),
          );
          validation.execute("Consumer Structure", () =>
            validator.validateConsumerStructure(consumer),
          );
          validation.execute("Consumer Id", () =>
            validator.validateConsumerId(consumer, consumerId),
          );
          validation.execute("Table Ref Id", () =>
            validator.validateTableRefId(consumer),
          );
          validation.execute("Consumer Name", () =>
            validator.validateConsumerName(consumer),
          );
          validation.execute("Allowed Statuses", () =>
            validator.validateAllowedStatuses(consumer, mapped.previousStatus),
          );
          validation.execute("Request Status Echo", () =>
            validator.validateRequestStatusEcho(consumer, requestStatus),
          );
          validation.execute("Previous Status", () =>
            validator.validatePreviousStatus(mapped.previousStatus),
          );
          validation.execute("Status Transition", () =>
            validator.validateStatusTransition(
              consumer,
              mapped.previousStatus,
              requestStatus,
            ),
          );
          validation.execute("Scenario Outcome", () =>
            validator.validateScenario(
              mapped,
              testCase.scenario,
              consumerId,
              requestStatus,
            ),
          );

          validation.printSummary(testCase.testName, responseTime);
        } finally {
          if (testCase.restoreStatus) {
            await api.updateActivation(consumerId, {
              status: testCase.restoreStatus,
            });
          }
        }
      },
    );
  }
});
