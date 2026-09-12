import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { MinMaxVoltageApi } from "../Api/minmaxvoltage.api";
import {
  minMaxVoltageMaxResponseTimeMs,
  minMaxVoltageTestCases,
  resolveMinMaxVoltageContractBody,
  resolveMinMaxVoltageQuery,
} from "../Data/minmaxvoltage.data";
import {
  MinMaxVoltageMapper,
  type MinMaxVoltageErrorBody,
} from "../Mapper/minmaxvoltage.mapper";
import { MinMaxVoltageValidator } from "../Validator/minmaxvoltage.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";

test.describe("Min-max voltage report", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of minMaxVoltageTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new MinMaxVoltageValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveMinMaxVoltageContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing min-max voltage contract body");
            return;
          }
          const mapped = MinMaxVoltageMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new MinMaxVoltageApi(authenticatedApi);
        const query = resolveMinMaxVoltageQuery(testCase.scenario);
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
          await api.getMinMaxVoltage(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfReportsInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/reports/min-max-voltage",
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
            minMaxVoltageMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as MinMaxVoltageErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = MinMaxVoltageMapper.map(responseBody);
        if (
          testCase.scenario === "dev_live_primary" ||
          testCase.scenario.startsWith("dev_live_min_") ||
          testCase.scenario.startsWith("dev_live_max_")
        ) {
          console.info(
            JSON.stringify(
              {
                msg: "min_max_voltage_live_response",
                scenario: testCase.scenario,
                query,
                queryString,
                pagination: mapped.pagination,
                columnKeys: mapped.columns.map((c) => c.key),
                rowCount: mapped.rows.length,
                sampleRow: mapped.rows[0] ?? null,
              },
              null,
              2,
            ),
          );
        }
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("Min-Max Voltage Scenario", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            query.page,
            query.limit,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
