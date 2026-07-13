import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrCapacityGaugeApi } from "../Api/dtrcapacitygauge.api";
import {
  dtrCapacityGaugeMaxResponseTimeMs,
  dtrCapacityGaugeTestCases,
  resolveDtrCapacityGaugeCode,
  resolveDtrCapacityGaugeContractBody,
  resolveDtrCapacityGaugeQuery,
} from "../Data/dtrcapacitygauge.data";
import {
  DtrCapacityGaugeMapper,
  type DtrCapacityGaugeErrorResponse,
} from "../Mapper/dtrcapacitygauge.mapper";
import { DtrCapacityGaugeValidator } from "../Validator/dtrcapacitygauge.validator";

test.describe("DTR Capacity Gauge API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrCapacityGaugeTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrCapacityGaugeValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrCapacityGaugeContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing DTR capacity gauge contract fixture body");
            return;
          }

          const mapped = DtrCapacityGaugeMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrCapacityGaugeApi(authenticatedApi);
        const dtrCode = resolveDtrCapacityGaugeCode(testCase.scenario);

        if (!dtrCode) {
          test.skip(true, "Could not resolve DTR capacity gauge code");
          return;
        }

        const query = resolveDtrCapacityGaugeQuery(testCase.scenario);
        const queryString = new URLSearchParams(
          Object.entries(query).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {},
          ),
        ).toString();

        const { rawResponse, responseBody, responseTime } =
          await api.getCapacityGauge(dtrCode, query);

        await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

        validation.execute("Status Validation", () => {
          if (testCase.scenario === "dtr_not_found") {
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
            dtrCapacityGaugeMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrCapacityGaugeErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "dtr_not_found" &&
          rawResponse.status() === 404
        ) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrCapacityGaugeErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank DTR Code Validation Error", () =>
            validator.validateBlankCodeError(
              responseBody as DtrCapacityGaugeErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DtrCapacityGaugeMapper.map(responseBody);
        validation.execute("DTR Capacity Gauge Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
