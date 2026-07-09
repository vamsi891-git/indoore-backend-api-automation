import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { RealTimePowerApi } from "../Api/realtimepower.api";
import {
  realTimePowerMaxResponseTimeMs,
  realTimePowerTestCases,
  resolveRealTimePowerContractBody,
  resolveRealTimePowerQuery,
  resolveRealTimePowerRef,
} from "../Data/realtimepower.data";
import {
  RealTimePowerMapper,
  type RealTimePowerErrorResponse,
} from "../Mapper/realtimepower.mapper";
import { RealTimePowerValidator } from "../Validator/realtimepower.validator";

test.describe("Real Time Power API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of realTimePowerTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new RealTimePowerValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveRealTimePowerContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing contract fixture body");
            return;
          }

          const mapped = RealTimePowerMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new RealTimePowerApi(authenticatedApi);
        const consumerRef = resolveRealTimePowerRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve real-time-power route ref");
          return;
        }

        const query = resolveRealTimePowerQuery(testCase.scenario);
        const endpoint = `/indore/consumers/${consumerRef}/real-time-power`;
        const { rawResponse, responseBody, responseTime } =
          await api.getRealTimePower(consumerRef, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () => {
          if (testCase.scenario === "meter_not_found") {
            expect([200, 404]).toContain(rawResponse.status());
            return;
          }
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody);
        });
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            realTimePowerMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as RealTimePowerErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "meter_not_found" && rawResponse.status() === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as RealTimePowerErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank Ref Validation Error", () =>
            validator.validateBlankRefError(
              responseBody as RealTimePowerErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = RealTimePowerMapper.map(responseBody);
        validation.execute("Real Time Power Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
