import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrStatisticsApi } from "../Api/dtrstatistics.api";
import {
  dtrStatisticsMaxResponseTimeMs,
  dtrStatisticsTestCases,
  resolveDtrStatisticsCode,
  resolveDtrStatisticsContractBody,
  resolveDtrStatisticsQuery,
} from "../Data/dtrstatistics.data";
import {
  DtrStatisticsMapper,
  type DtrStatisticsErrorResponse,
} from "../Mapper/dtrstatistics.mapper";
import { DtrStatisticsValidator } from "../Validator/dtrstatistics.validator";

test.describe("DTR Statistics API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrStatisticsTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrStatisticsValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrStatisticsContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing DTR statistics contract fixture body");
            return;
          }

          const mapped = DtrStatisticsMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario, fixtureBody),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrStatisticsApi(authenticatedApi);
        const dtrCode = resolveDtrStatisticsCode(testCase.scenario);

        if (!dtrCode) {
          test.skip(true, "Could not resolve DTR statistics code");
          return;
        }

        const query = resolveDtrStatisticsQuery(testCase.scenario);
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
        const endpoint = `/indore/dtr/${encodeURIComponent(dtrCode)}/statistics${
          queryString ? `?${queryString}` : ""
        }`;

        const { rawResponse, responseBody, responseTime } =
          await api.getDtrStatistics(dtrCode, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
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
            dtrStatisticsMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrStatisticsErrorResponse,
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
              responseBody as DtrStatisticsErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank DTR Code Validation Error", () =>
            validator.validateBlankCodeError(
              responseBody as DtrStatisticsErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DtrStatisticsMapper.map(responseBody);
        validation.execute("DTR Statistics Scenario", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            responseBody,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
