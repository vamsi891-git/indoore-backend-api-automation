import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ReportsOverviewApi } from "../Api/overview.api";
import {
  reportsOverviewMaxResponseTimeMs,
  reportsOverviewTestCases,
  resolveReportsOverviewContractBody,
  resolveReportsOverviewQuery,
} from "../Data/overview.data";
import {
  ReportsOverviewMapper,
  type ReportsOverviewErrorBody,
} from "../Mapper/overview.mapper";
import { ReportsOverviewValidator } from "../Validator/overview.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Reports overview", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of reportsOverviewTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new ReportsOverviewValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveReportsOverviewContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing reports-overview contract body");
            return;
          }
          const mapped = ReportsOverviewMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new ReportsOverviewApi(authenticatedApi);
        const query = resolveReportsOverviewQuery(testCase.scenario);

        const { rawResponse, responseBody, responseTime } =
          await api.getOverview(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            reportsOverviewMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as ReportsOverviewErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = ReportsOverviewMapper.map(responseBody);
        if (testCase.scenario === "dev_live") {
          console.info(
            JSON.stringify(
              {
                msg: "reports_overview_live_response",
                scenario: testCase.scenario,
                query,
                kpis: {
                  successful: mapped.successful,
                  scheduled: mapped.scheduled,
                  downloads: mapped.downloads,
                  failed: mapped.failed,
                },
                currentPeriod: mapped.currentPeriod,
                comparisonPeriod: mapped.comparisonPeriod,
                note:
                  mapped.successful?.currentValue === 0 &&
                  mapped.successful?.available === true
                    ? "zero KPI values with available=true is valid"
                    : undefined,
              },
              null,
              2,
            ),
          );
        }
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("Overview Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
