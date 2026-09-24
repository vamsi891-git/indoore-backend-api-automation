import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { TechnicalReportApi } from "../Api/technicalanalysis.api";
import {
  getTechnicalReportLiveConfig,
  resolveTechnicalReportContractBody,
  resolveTechnicalReportQuery,
  technicalAnalysisLiveConfigs,
  technicalAnalysisReportTitle,
  technicalReportTestCases,
  type TechnicalAnalysisLiveConfig,
} from "../Data/technicalanalysis.data";
import {
  isTechnicalGridData,
  TechnicalReportMapper,
  type TechnicalReportMapped,
} from "../Mapper/technicalanalysis.mapper";
import { TechnicalReportValidator } from "../Validator/technical-analysis.shared";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import {
  TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
  TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { logTechnicalAnalysisDataQualityFindings } from "../Db/technical-analysis-db.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
function runLiveReportValidations(
  validation: ApiValidationHelper,
  validator: TechnicalReportValidator,
  mapped: TechnicalReportMapped,
  liveConfig: TechnicalAnalysisLiveConfig,
  columns?: Array<{ key: string; header: string }>,
): void {
  validation.execute("Response Structure Validation", () =>
    validator.validateResponseStructure(mapped),
  );
  validation.execute("Analysis Type Validation", () =>
    validator.validateAnalysisType(mapped.analysisType, liveConfig.analysisType),
  );
  validation.execute("Month Validation", () =>
    validator.validateMonth(mapped.month, liveConfig.month),
  );
  validation.execute("Year Validation", () => validator.validateYear(mapped.year, liveConfig.year));
  if (liveConfig.validationType === "phase") {
    validation.execute("Phase column header", () => validator.validatePhaseColumns(columns));
  } else {
    validation.execute("Zone column header", () => validator.validateZoneColumn(columns));
  }
  if (
    liveConfig.validationType === "duration100" ||
    liveConfig.validationType === "duration12" ||
    liveConfig.validationType === "duration10"
  ) {
    validation.execute("Duration column headers", () =>
      validator.validateDurationColumns(
        columns,
        liveConfig.hasData,
        liveConfig.analysisType.startsWith("ynr_"),
      ),
    );
  }
  if (liveConfig.validationType === "phase") {
    validation.execute("Phase Pagination Validation", () =>
      validator.validatePhasePagination(mapped),
    );
  } else {
    validation.execute("Pagination Validation", () => validator.validatePagination(mapped));
    validation.execute("Pagination Consistency Validation", () =>
      validator.validatePaginationConsistency(mapped),
    );
  }
  validation.execute("Cross Field Validation", () => validator.validateCrossFieldLogic(mapped));

  if (!liveConfig.hasData) {
    validation.execute("No Data Validation", () => validator.validateNoDataScenario(mapped));
    return;
  }

  if (liveConfig.validationType === "phase") {
    validation.execute("Phase Report Validation", () => validator.validatePhaseReport(mapped.rows));
    return;
  }

  mapped.rows.forEach((row, index) => {
    validation.execute(`Row ${index + 1} Structure Validation`, () =>
      validator.validateRowStructure(row),
    );
    validation.execute(`Row ${index + 1} Type Validation`, () => validator.validateRowTypes(row));
    validation.execute(`Row ${index + 1} Null Validation`, () => validator.validateNulls(row));
    validation.execute(`Row ${index + 1} Undefined Validation`, () =>
      validator.validateUndefined(row),
    );
    validation.execute(`Row ${index + 1} Empty Validation`, () =>
      validator.validateEmptyStrings(row),
    );
    validation.execute(`Row ${index + 1} NaN Validation`, () => validator.validateNaN(row));
  });

  validation.execute("Duplicate meter contract", () =>
    validator.validateDuplicateContract(mapped.rows),
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
      validation.execute("Count Report Validation", () =>
        validator.validateCountReport(mapped.rows),
      );
      break;
  }
}
test.describe("Technical report", () => {
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS);

  for (const testCase of technicalReportTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new TechnicalReportValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const liveConfig = getTechnicalReportLiveConfig(testCase);
      if (testCase.isContractFixture) {
        const fixtureBody = resolveTechnicalReportContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing technical report contract body");
          return;
        }
        const query = resolveTechnicalReportQuery(testCase.scenario);
        const mapped = TechnicalReportMapper.map(fixtureBody, {
          analysisType: query.analysisType ?? "power_failure",
          month: query.month ?? 10,
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
      const query = resolveTechnicalReportQuery(testCase.scenario, liveConfig);
      const api = new TechnicalReportApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getTechnicalReport(query);
      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );
      if (BackendResponse.isServerError(rawResponse.status())) {
        BackendResponse.logFinding(testCase.testName, rawResponse.status(), responseBody);
      }
      try {
        validation.execute("Status Code Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time Validation", () =>
          assert.validateResponseTime(
            responseTime,
            liveConfig?.maxResponseTime ?? TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
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
          month: query.month ?? 10,
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
            isTechnicalGridData(responseBody.data) ? responseBody.data.columns : undefined,
          );
          await logTechnicalAnalysisDataQualityFindings("report", {
            rows: mapped.rows,
          });
          return;
        }
        validation.execute("Response Structure Validation", () =>
          validator.validateResponseStructure(mapped),
        );
        validation.execute("Pagination Validation", () => validator.validatePagination(mapped));
        validation.execute("Cross Field Validation", () =>
          validator.validateCrossFieldLogic(mapped),
        );
        validation.execute("Scenario Validation", () =>
          validator.validateScenario(mapped, testCase.scenario, query.page),
        );
        if (
          testCase.scenario === "dev_category_domestic" ||
          testCase.scenario === "dev_category_non_domestic"
        ) {
          validation.execute("No duplicate meters", () =>
            validator.validateDuplicateContract(mapped.rows),
          );
        }
      } finally {
        validation.finalize(testCase.testName, responseTime);
      }
    });
  }

  test.describe("Technical report — first and last page have no duplicate meters", () => {
    test.describe.configure({ retries: 0 });

    for (const liveConfig of technicalAnalysisLiveConfigs.filter((c) => c.hasData)) {
      test(
        `${technicalAnalysisReportTitle(liveConfig.analysisType)} report — first and last page have no duplicate meters`,
        { tag: ["@technical-analysis", "@report"] },
        async ({ authenticatedApi }) => {
          const api = new TechnicalReportApi(authenticatedApi);
          const validator = new TechnicalReportValidator();
          const validation = new ApiValidationHelper();
          const query = resolveTechnicalReportQuery("dev_live_report", liveConfig);
          const first = await api.getTechnicalReport(query);
          expect(first.rawResponse.status()).toBe(200);
          const mappedFirst = TechnicalReportMapper.map(first.responseBody, {
            analysisType: liveConfig.analysisType,
            month: liveConfig.month,
            year: liveConfig.year,
            pageSize: liveConfig.pageSize,
            category: query.category,
            page: 1,
          });
          const uniqueness =
            liveConfig.validationType === "phase"
              ? (rows: typeof mappedFirst.rows) => validator.validatePhaseReport(rows)
              : (rows: typeof mappedFirst.rows) => validator.validateDuplicateContract(rows);
          validation.execute("Page 1 uniqueness", () => uniqueness(mappedFirst.rows));
          if (liveConfig.validationType === "phase") {
            validation.finalize(
              `${liveConfig.analysisType} first/last uniqueness`,
              first.responseTime,
            );
            return;
          }
          const lastPage = Math.max(1, mappedFirst.totalPages);
          const last = await api.getTechnicalReport({ ...query, page: lastPage });
          expect(last.rawResponse.status()).toBe(200);
          const mappedLast = TechnicalReportMapper.map(last.responseBody, {
            analysisType: liveConfig.analysisType,
            month: liveConfig.month,
            year: liveConfig.year,
            pageSize: liveConfig.pageSize,
            category: query.category,
            page: lastPage,
          });
          validation.execute(`Last page ${lastPage} uniqueness`, () => uniqueness(mappedLast.rows));
          validation.finalize(
            `${liveConfig.analysisType} first/last uniqueness`,
            first.responseTime,
          );
        },
      );
    }
  });
});
