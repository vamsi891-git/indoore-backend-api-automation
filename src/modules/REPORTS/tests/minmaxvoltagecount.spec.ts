import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { MinMaxVoltageApi } from "../Api/minmaxvoltage.api";
import { MinMaxVoltageCountApi } from "../Api/minmaxvoltagecount.api";
import {
  minMaxVoltageCountMaxResponseTimeMs,
  minMaxVoltageCountTestCases,
  resolveMinMaxVoltageCountContractBody,
  resolveMinMaxVoltageCountQuery,
} from "../Data/minmaxvoltagecount.data";
import {
  MinMaxVoltageCountMapper,
  type MinMaxVoltageCountErrorBody,
} from "../Mapper/minmaxvoltagecount.mapper";
import { MinMaxVoltageMapper } from "../Mapper/minmaxvoltage.mapper";
import { MinMaxVoltageCountValidator } from "../Validator/minmaxvoltagecount.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const LIVE_LIST_SCENARIOS = new Set([
  "dev_live_primary",
  "dev_live_min_y",
  "dev_live_min_b",
  "dev_live_max_r",
  "dev_live_max_y",
  "dev_live_max_b",
]);

test.describe("Min-max voltage count", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of minMaxVoltageCountTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new MinMaxVoltageCountValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveMinMaxVoltageCountContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing min-max voltage count contract body");
            return;
          }
          const mapped = MinMaxVoltageCountMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new MinMaxVoltageCountApi(authenticatedApi);
        const query = resolveMinMaxVoltageCountQuery(testCase.scenario);

        const { rawResponse, responseBody, responseTime } =
          await api.getMinMaxVoltageCount(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfReportsInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/reports/min-max-voltage/count",
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
            minMaxVoltageCountMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as MinMaxVoltageCountErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = MinMaxVoltageCountMapper.map(responseBody);

        let listTotal: number | undefined;
        if (LIVE_LIST_SCENARIOS.has(testCase.scenario)) {
          const listResult = await new MinMaxVoltageApi(
            authenticatedApi,
          ).getMinMaxVoltage({
            meterPhaseTblRefId: query.meterPhaseTblRefId,
            month: query.month,
            year: query.year,
            voltageType: query.voltageType,
            phase: query.phase,
            page: 1,
            limit: 10,
            includeTotal: true,
          });
          skipIfReportsInternalError(
            listResult.rawResponse.status(),
            listResult.responseBody,
            "/indore/reports/min-max-voltage",
          );
          const listMapped = MinMaxVoltageMapper.map(listResult.responseBody);
          listTotal = listMapped.pagination.total;
        }

        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("Count Keys", () =>
          validator.validateDataKeys(responseBody),
        );
        validation.execute("Min-Max Voltage Count Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, listTotal),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
