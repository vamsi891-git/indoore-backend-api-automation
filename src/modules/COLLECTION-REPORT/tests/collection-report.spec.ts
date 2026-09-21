import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { CollectionReportApi } from "../Api/collection-report.api";
import {
  collectionReportMaxResponseTimeMs,
  collectionReportTestCases,
  reportTypeForScenario,
  resolveCollectionReportContractBody,
  resolveCollectionReportQuery,
} from "../Data/collection-report.data";
import {
  CollectionReportMapper,
  type CollectionReportErrorBody,
} from "../Mapper/collection-report.mapper";
import { CollectionReportValidator } from "../Validator/collection-report.validator";
import { skipIfCollectionReportUnavailable } from "../utils/collection-report-env.helper";

test.describe("Collection report", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of collectionReportTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new CollectionReportValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveCollectionReportContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing collection report contract body");
          return;
        }
        const mapped = CollectionReportMapper.map(fixtureBody);
        const reportType = reportTypeForScenario(testCase.scenario) ?? "current-mismatch";
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            reportType,
            mapped.pagination.page,
            mapped.pagination.limit,
            { nonEmptyExpected: testCase.nonEmptyExpected },
          ),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new CollectionReportApi(authenticatedApi);
      const query = resolveCollectionReportQuery(testCase.scenario);

      // Drop undefined reportType for missing_report_type so the param is omitted.
      if (testCase.scenario === "missing_report_type") {
        delete (query as { reportType?: unknown }).reportType;
      }

      const { rawResponse, responseBody, responseTime } = await api.getCollectionReport(query);

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      if (expectedStatus === 200) {
        skipIfCollectionReportUnavailable(rawResponse.status(), responseBody);
      }

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, collectionReportMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (expectedStatus !== 200) {
        validation.execute("Validation Error", () => {
          const body = responseBody as CollectionReportErrorBody;
          if (
            testCase.scenario === "dev_alarm_last_gasp_range_rejected" ||
            testCase.scenario === "dev_alarm_first_gasp_range_rejected"
          ) {
            validator.validateGaspRangeError(body);
          } else {
            validator.validateValidationError(body);
          }
        });
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Zod Envelope", () => validator.validateZodSuccess(responseBody));

      const mapped = CollectionReportMapper.map(responseBody);
      const reportType = reportTypeForScenario(testCase.scenario) ?? "current-mismatch";

      if (
        testCase.scenario === "dev_current_mismatch" ||
        testCase.scenario === "dev_neutral_zero" ||
        testCase.scenario === "dev_no_load"
      ) {
        console.info(
          JSON.stringify(
            {
              msg: "collection_report_live_response",
              reportType,
              query,
              pagination: mapped.pagination,
              metersFetched: mapped.metersFetched,
              hasMore: mapped.hasMore,
              nextMeterLookupId: mapped.nextMeterLookupId,
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
      validation.execute("Collection Report Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario, reportType, query.page, query.limit, {
          nonEmptyExpected: testCase.nonEmptyExpected,
        }),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
