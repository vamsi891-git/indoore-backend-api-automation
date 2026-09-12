import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerReportApi } from "../Api/consumerreport.api";
import {
  consumerReportMaxResponseTimeMs,
  consumerReportTestCases,
  resolveConsumerReportContractBody,
  resolveConsumerReportQuery,
} from "../Data/consumerreport.data";
import {
  ConsumerReportMapper,
  type ConsumerReportErrorBody,
} from "../Mapper/consumerreport.mapper";
import { ConsumerReportValidator } from "../Validator/consumerreport.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";

test.describe("Consumer report", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of consumerReportTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new ConsumerReportValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveConsumerReportContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing consumer-report contract body");
            return;
          }
          const mapped = ConsumerReportMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new ConsumerReportApi(authenticatedApi);
        const query = resolveConsumerReportQuery(testCase.scenario);
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
          await api.getConsumerReport(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfReportsInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/reports/consumer-report",
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
            consumerReportMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as ConsumerReportErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = ConsumerReportMapper.map(responseBody);
        if (
          testCase.scenario === "dev_live_ls" ||
          testCase.scenario === "dev_live_dp" ||
          testCase.scenario === "dev_live_ip"
        ) {
          console.info(
            JSON.stringify(
              {
                msg: "consumer_report_live_response",
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
        validation.execute("Consumer Report Scenario", () =>
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
