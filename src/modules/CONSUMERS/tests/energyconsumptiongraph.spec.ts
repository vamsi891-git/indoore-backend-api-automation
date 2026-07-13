import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { EnergyConsumptionGraphApi } from "../Api/energyconsumptiongraph.api";
import {
  energyConsumptionGraphMaxResponseTimeMs,
  energyConsumptionGraphTestCases,
  resolveEnergyConsumptionGraphContractBody,
  resolveEnergyConsumptionGraphExpectedPeriod,
  resolveEnergyConsumptionGraphQuery,
  resolveEnergyConsumptionGraphRef,
} from "../Data/energyconsumptiongraph.data";
import {
  EnergyConsumptionGraphMapper,
  type EnergyConsumptionGraphErrorResponse,
} from "../Mapper/energyconsumptiongraph.mapper";
import { EnergyConsumptionGraphValidator } from "../Validator/energyconsumptiongraph.validator";

test.describe("Energy Consumption Graph API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of energyConsumptionGraphTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new EnergyConsumptionGraphValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const expectedPeriod = resolveEnergyConsumptionGraphExpectedPeriod(
          testCase.scenario,
        );

        if (testCase.isContractFixture) {
          const fixtureBody = resolveEnergyConsumptionGraphContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(
              true,
              "Missing energy-consumption-graph contract fixture body",
            );
            return;
          }

          const mapped = EnergyConsumptionGraphMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario, expectedPeriod),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new EnergyConsumptionGraphApi(authenticatedApi);
        const consumerRef = resolveEnergyConsumptionGraphRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(
            true,
            "Could not resolve energy-consumption-graph route ref",
          );
          return;
        }

        const query = resolveEnergyConsumptionGraphQuery(testCase.scenario);
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
          await api.getEnergyConsumptionGraph(consumerRef, query);

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
            energyConsumptionGraphMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EnergyConsumptionGraphErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "meter_not_found" && rawResponse.status() === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as EnergyConsumptionGraphErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          if (testCase.scenario === "invalid_period") {
            validation.execute("Invalid Period Validation Error", () =>
              validator.validateInvalidPeriodError(
                responseBody as EnergyConsumptionGraphErrorResponse,
              ),
            );
          } else {
            validation.execute("Blank Ref Validation Error", () =>
              validator.validateBlankRefError(
                responseBody as EnergyConsumptionGraphErrorResponse,
              ),
            );
          }
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = EnergyConsumptionGraphMapper.map(responseBody);
        validation.execute("Energy Consumption Graph Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, expectedPeriod),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
