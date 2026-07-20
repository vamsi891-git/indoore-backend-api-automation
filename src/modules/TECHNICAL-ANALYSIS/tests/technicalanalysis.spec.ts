import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { TechnicalReportApi } from "../Api/technicalanalysis.api";
import { getTechnicalReportLiveConfig, resolveTechnicalReportContractBody, resolveTechnicalReportQuery, technicalReportTestCases, type TechnicalAnalysisLiveConfig, } from "../Data/technicalanalysis.data";
import { TechnicalReportMapper, type TechnicalReportMapped, } from "../Mapper/technicalanalysis.mapper";
import { TechnicalReportValidator } from "../Validator/technical-analysis.shared";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS, TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS, } from "../../../core/constants/api-timeouts";
function runLiveReportValidations(validation: ValidationEngine, validator: TechnicalReportValidator, mapped: TechnicalReportMapped, liveConfig: TechnicalAnalysisLiveConfig,): void {
  validation.execute("Response Structure Validation", () =>
    validator.validateResponseStructure(mapped),
  );
  validation.execute("Analysis Type Validation", () =>
    validator.validateAnalysisType(
      mapped.analysisType,
      liveConfig.analysisType,
    ),
  );
  validation.execute("Month Validation", () =>
    validator.validateMonth(mapped.month, liveConfig.month),
  );
  validation.execute("Year Validation", () =>
    validator.validateYear(mapped.year, liveConfig.year),
  );
  validation.execute("Pagination Validation", () =>
    validator.validatePagination(mapped),
  );
  validation.execute("Pagination Consistency Validation", () =>
    validator.validatePaginationConsistency(mapped),
  );
  validation.execute("Cross Field Validation", () =>
    validator.validateCrossFieldLogic(mapped),
  );

  if (!liveConfig.hasData) {
    validation.execute("No Data Validation", () =>
      validator.validateNoDataScenario(mapped),
    );
    return;
  }
  mapped.rows.forEach((row, index) => {
    validation.execute(`Row ${index + 1} Structure Validation`, () =>
      validator.validateRowStructure(row),
    );
    validation.execute(`Row ${index + 1} Type Validation`, () =>
      validator.validateRowTypes(row),
    );
    validation.execute(`Row ${index + 1} Null Validation`, () =>
      validator.validateNulls(row),
    );
    validation.execute(`Row ${index + 1} Undefined Validation`, () =>
      validator.validateUndefined(row),
    );
    validation.execute(`Row ${index + 1} Empty Validation`, () =>
      validator.validateEmptyStrings(row),
    );
    validation.execute(`Row ${index + 1} NaN Validation`, () =>
      validator.validateNaN(row),
    );
  });

  validation.execute("Duplicate Meter Id Validation", () =>
    validator.validateDuplicateMeterIds(mapped.rows),
  );
  validation.execute("Duplicate MSN Validation", () =>
    validator.validateDuplicateMSN(mapped.rows),
  );
  validation.execute("Duplicate IVRS Validation", () =>
    validator.validateDuplicateIVRS(mapped.rows),
  );
  validation.execute("Duplicate Meter Event Validation", () =>
    validator.validateDuplicateMeterEvent(mapped.rows),
  );
  validation.execute("Duplicate Row Validation", () =>
    validator.validateDuplicateRows(mapped.rows),
  );

  switch (liveConfig.validationType) {
    case "duration100":
      validation.execute("Duration Type Validation", () =>
        validator.validateDurationType(mapped.rows),
      );
      validation.execute("Duration > 100 Validation", () =>
        validator.validateDuration100(mapped.rows),
      );
      break;
    case "duration12":
      validation.execute("Duration Type Validation", () =>
        validator.validateDurationType(mapped.rows),
      );
      validation.execute("Duration >= 12 Validation", () =>
        validator.validateDuration12(mapped.rows),
      );
      break;
    case "duration10":
      validation.execute("Duration Type Validation", () =>
        validator.validateDurationType(mapped.rows),
      );
      validation.execute("Duration >= 10 Validation", () =>
        validator.validateDuration10(mapped.rows),
      );
      break;
    case "count":
    case "phase":
      validation.execute("Count Report Validation", () =>
        validator.validateCountReport(mapped.rows),
      );
      break;
  }
}
test.describe("Technical Analysis Report API", () => {
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS);

  for (const testCase of technicalReportTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new TechnicalReportValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const liveConfig = getTechnicalReportLiveConfig(testCase);
        if (testCase.isContractFixture) {
          const fixtureBody = resolveTechnicalReportContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing technical report contract body");
            return;
          }
          const query = resolveTechnicalReportQuery(testCase.scenario);
          const mapped = TechnicalReportMapper.map(fixtureBody, {
            analysisType:
              query.analysisType ?? "power_failure",
            month: query.month ?? 12,
            year: query.year ?? 2025,
            pageSize: query.pageSize ?? 10,
            category: query.category,
            page: query.page,
          });
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.finalize(testCase.testName, 0);
          return;
        }
        const query = resolveTechnicalReportQuery(
          testCase.scenario,
          liveConfig,
        );
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
        const api = new TechnicalReportApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getTechnicalReport(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime
        );
        if (BackendResponse.isServerError(rawResponse.status())) {
          BackendResponse.logFinding(
            testCase.testName,
            rawResponse.status(),
            responseBody,
          );
        }
        try {
          validation.execute("Status Code Validation", () =>
            assert.validateStatusCode(
              rawResponse,
              expectedStatus,
              responseBody,
            ),
          );
          validation.execute("Content Type Validation", () =>
            assert.validateContentType(rawResponse),
          );
          validation.execute("Response Time Validation", () =>
            assert.validateResponseTime(
              responseTime,
              liveConfig?.maxResponseTime ??
              TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
            ),
          );
          validation.execute("Sensitive Data Validation", () =>
            assert.validateSensitiveData(responseBody),
          );
          if (expectedStatus !== 200) {
            validation.execute("Validation Error", () =>
              validator.validateValidationError(responseBody),
            );
            return;
          }
          validation.execute("Success Validation", () => {
            expect(responseBody.success).toBeTruthy();
          });
          if (!responseBody.success) {
            validation.execute("Error Envelope", () =>
              validator.validateValidationError(responseBody),
            );
            return;
          }
          const mapped = TechnicalReportMapper.map(responseBody, {
            analysisType: query.analysisType ?? "power_failure",
            month: query.month ?? 12,
            year: query.year ?? 2025,
            pageSize: query.pageSize ?? 100,
            category: query.category,
            page: query.page,
          });
          if (testCase.scenario === "dev_live_report" && liveConfig) {
            runLiveReportValidations(
              validation,
              validator,
              mapped,
              liveConfig,
            );
            return;
          }
          validation.execute("Response Structure Validation", () =>
            validator.validateResponseStructure(mapped),
          );
          validation.execute("Pagination Validation", () =>
            validator.validatePagination(mapped),
          );
          validation.execute("Cross Field Validation", () =>
            validator.validateCrossFieldLogic(mapped),
          );
          validation.execute("Scenario Validation", () =>
            validator.validateScenario(
              mapped,
              testCase.scenario,
              query.page,
            ),
          );
        } finally {
          validation.finalize(testCase.testName, responseTime);
        }
      },
    );
  }
});
