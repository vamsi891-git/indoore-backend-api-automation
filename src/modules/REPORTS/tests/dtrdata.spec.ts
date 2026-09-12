import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrDataApi } from "../Api/dtrdata.api";
import {
  dtrDataMaxResponseTimeMs,
  dtrDataTestCases,
  resolveDtrDataContractBody,
  resolveDtrDataQuery,
} from "../Data/dtrdata.data";
import {
  DtrDataMapper,
  type DtrDataErrorBody,
} from "../Mapper/dtrdata.mapper";
import { DtrDataValidator } from "../Validator/dtrdata.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";

test.describe("DTR data report", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrDataTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrDataValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrDataContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing dtr-data contract body");
            return;
          }
          const mapped = DtrDataMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrDataApi(authenticatedApi);
        const query = resolveDtrDataQuery(testCase.scenario);
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
          await api.getDtrData(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfReportsInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/reports/dtr-data",
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, dtrDataMaxResponseTimeMs),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Error Envelope", () => {
            if (testCase.expectedErrorCode === "REPORT_BACKGROUND_REQUIRED") {
              validator.validateBackgroundRequiredError(
                responseBody as DtrDataErrorBody,
              );
            } else {
              validator.validateValidationError(
                responseBody as DtrDataErrorBody,
              );
            }
          });
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = DtrDataMapper.map(responseBody);
        if (
          testCase.scenario === "dev_live_primary" ||
          testCase.scenario === "dev_live_ls" ||
          testCase.scenario === "dev_live_dp_week" ||
          testCase.scenario === "dev_live_include_total"
        ) {
          console.info(
            JSON.stringify(
              {
                msg: "dtr_data_live_response",
                scenario: testCase.scenario,
                query,
                queryString,
                pagination: mapped.pagination,
                columnKeys: mapped.columns.map((c) => c.key),
                rowCount: mapped.rows.length,
                note:
                  mapped.pagination.total === null && mapped.rows.length > 0
                    ? "includeTotal=false: null total with rows is valid"
                    : undefined,
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
        validation.execute("DTR Data Scenario", () =>
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
