import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CurrentWithoutVoltageApi } from "../Api/currentwithoutvoltage.api";
import {
  currentWithoutVoltageMaxResponseTimeMs,
  currentWithoutVoltageTestCases,
  resolveCurrentWithoutVoltageContractBody,
  resolveCurrentWithoutVoltageQuery,
} from "../Data/currentwithoutvoltage.data";
import {
  CurrentWithoutVoltageMapper,
  type CurrentWithoutVoltageErrorBody,
} from "../Mapper/currentwithoutvoltage.mapper";
import { CurrentWithoutVoltageValidator } from "../Validator/currentwithoutvoltage.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Current without voltage report", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of currentWithoutVoltageTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new CurrentWithoutVoltageValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveCurrentWithoutVoltageContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing current-without-voltage contract body");
            return;
          }
          const mapped = CurrentWithoutVoltageMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new CurrentWithoutVoltageApi(authenticatedApi);
        const query = resolveCurrentWithoutVoltageQuery(testCase.scenario);
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
          await api.getCurrentWithoutVoltage(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        if (expectedStatus === 200) {
          skipIfReportsInternalError(
            rawResponse.status(),
            responseBody,
            "/indore/reports/current-without-voltage",
          );
        }

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            currentWithoutVoltageMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as CurrentWithoutVoltageErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = CurrentWithoutVoltageMapper.map(responseBody);
        if (
          testCase.scenario === "dev_live_primary" ||
          testCase.scenario === "dev_live_phase_y" ||
          testCase.scenario === "dev_live_phase_b"
        ) {
          console.info(
            JSON.stringify(
              {
                msg: "current_without_voltage_live_response",
                scenario: testCase.scenario,
                query,
                queryString,
                pagination: mapped.pagination,
                columnKeys: mapped.columns.map((c) => c.key),
                currentHeader: mapped.columns.find((c) => c.key === "rCurrent")
                  ?.header,
                voltageHeader: mapped.columns.find((c) => c.key === "rnVoltage")
                  ?.header,
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
        validation.execute("Current Without Voltage Scenario", () =>
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
