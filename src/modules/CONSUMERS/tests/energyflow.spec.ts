import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { EnergyFlowApi } from "../Api/energyflow.api";
import {
  energyFlowMaxResponseTimeMs,
  energyFlowTestCases,
  resolveEnergyFlowContractBody,
  resolveEnergyFlowExpectedPeriod,
  resolveEnergyFlowQuery,
  resolveEnergyFlowRef,
} from "../Data/energyflow.data";
import {
  EnergyFlowMapper,
  type EnergyFlowErrorResponse,
} from "../Mapper/energyflow.mapper";
import { EnergyFlowValidator } from "../Validator/energyflow.validator";

test.describe("Energy Flow API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of energyFlowTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new EnergyFlowValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const expectedPeriod = resolveEnergyFlowExpectedPeriod(testCase.scenario);

        if (testCase.isContractFixture) {
          const fixtureBody = resolveEnergyFlowContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing energy-flow contract fixture body");
            return;
          }

          const mapped = EnergyFlowMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario, expectedPeriod),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new EnergyFlowApi(authenticatedApi);
        const consumerRef = resolveEnergyFlowRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve energy-flow route ref");
          return;
        }

        const query = resolveEnergyFlowQuery(testCase.scenario);
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
          await api.getEnergyFlow(consumerRef, query);

        await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
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
            energyFlowMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EnergyFlowErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "meter_not_found" && rawResponse.status() === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EnergyFlowErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          if (testCase.scenario === "invalid_period") {
            validation.execute("Invalid Period Validation Error", () =>
              validator.validateInvalidPeriodError(
                responseBody as EnergyFlowErrorResponse,
              ),
            );
          } else {
            validation.execute("Blank Ref Validation Error", () =>
              validator.validateBlankRefError(
                responseBody as EnergyFlowErrorResponse,
              ),
            );
          }
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = EnergyFlowMapper.map(responseBody);
        validation.execute("Energy Flow Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, expectedPeriod),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
