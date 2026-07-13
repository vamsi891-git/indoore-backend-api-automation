import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { TechnicalSummaryApi } from "../Api/technical-summary.api";
import {
  resolveTechnicalSummaryQuery,
  technicalSummaryExpectedAnalysisTypes,
  technicalSummaryMaxResponseTimeMs,
  technicalSummaryTestCases,
} from "../Data/technical-summary.data";
import { TechnicalSummaryMapper } from "../Mapper/technical-summary.mapper";
import { TechnicalSummaryValidator } from "../Validator/technical-summary.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

test.describe("Technical Summary API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS);

  for (const testCase of technicalSummaryTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const query = resolveTechnicalSummaryQuery(testCase.scenario);
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

        const api = new TechnicalSummaryApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getTechnicalSummary(query);

        await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new TechnicalSummaryValidator();

        try {
          validation.execute("Status Code", () =>
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
              technicalSummaryMaxResponseTimeMs,
            ),
          );
          validation.execute("Sensitive Data", () =>
            assert.validateSensitiveData(responseBody),
          );

          if (expectedStatus !== 200) {
            validation.execute("Validation Error", () =>
              validator.validateValidationError(responseBody),
            );
            return;
          }

          if (rawResponse.status() !== 200 || !responseBody.success) {
            validation.execute("Error Envelope", () =>
              validator.validateApiError(responseBody),
            );
            return;
          }

          validation.execute("Data Payload", () => {
            expect(responseBody.data).toBeDefined();
          });
          if (!responseBody.data) {
            return;
          }

          const mapped = TechnicalSummaryMapper.map(responseBody);

          validation.execute("Month Validation", () =>
            validator.validateMonth(mapped.month),
          );
          validation.execute("Year Validation", () =>
            validator.validateYear(mapped.year),
          );

          if (query.month !== undefined && query.year !== undefined) {
            validation.execute("Query Echo", () =>
              validator.validateQueryEcho(
                mapped.month,
                mapped.year,
                query.month!,
                query.year!,
              ),
            );
          }

          validation.execute("Reports Validation", () =>
            validator.validateReportsExist(mapped.reports),
          );
          validation.execute("Duplicate Analysis Validation", () =>
            validator.validateDuplicateAnalysisTypes(mapped.reports),
          );
          validation.execute("Technical Category Validation", () =>
            validator.validateTechnicalReports(mapped.reports),
          );
          validation.execute("YNR Category Validation", () =>
            validator.validateYnrReports(mapped.reports),
          );

          if (testCase.scenario === "dev_live_primary") {
            validation.execute("Expected Analysis Types", () =>
              validator.validateExpectedAnalysisTypes(
                mapped.reports,
                technicalSummaryExpectedAnalysisTypes,
              ),
            );
          }

          if (testCase.scenario === "dev_live_primary") {
            mapped.reports.forEach((report) => {
            validation.execute(
              `${report.analysisType} Field Validation`,
              () => validator.validateFields(report),
            );
            validation.execute(
              `${report.analysisType} Type Validation`,
              () => validator.validateTypes(report),
            );
            validation.execute(
              `${report.analysisType} Count Validation`,
              () => validator.validateCounts(report),
            );
            validation.execute(
              `${report.analysisType} NaN Validation`,
              () => validator.validateNaN(report),
            );
            validation.execute(
              `${report.analysisType} Category Validation`,
              () => validator.validateCategory(report),
            );
            validation.execute(
              `${report.analysisType} Business Rule Validation`,
              () => validator.validateBusinessRules(report),
            );
            validation.execute(
              `${report.analysisType} Zero Count Validation`,
              () => validator.validateZeroCountLogic(report),
            );
            validation.execute(
              `${report.analysisType} Empty String Validation`,
              () => validator.validateEmptyStrings(report),
            );
            });
          }
        } finally {
          validation.finalize(testCase.testName, responseTime);
        }
      },
    );
  }
});
