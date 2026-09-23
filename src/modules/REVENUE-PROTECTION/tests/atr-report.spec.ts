import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { AtrReportApi } from "../Api/atr-report.api";
import { atrReportMaxResponseTimeMs, atrReportTestCases } from "../Data/atr-report.data";
import { AtrReportMapper } from "../Mapper/atr-report.mapper";
import { AtrReportValidator } from "../Validator/atr-report.validator";
import { AtrReportSuccessResponseSchema } from "../schemas/atr-report.schemas";

test.describe("Revenue Protection — ATR Report API", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of atrReportTestCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new AtrReportApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getAtrReport(testCase.query);
      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new AtrReportValidator();
      const mapped = AtrReportMapper.mapData(responseBody.data);

      if (testCase.nonEmptyExpected && mapped.pagination.total === 0) {
        test.skip(
          true,
          `No atr-report rows for ${testCase.query.reportType} year=${testCase.query.year}`,
        );
      }

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, atrReportMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AtrReportSuccessResponseSchema, responseBody),
      );
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Columns", () =>
        validator.validateColumns(mapped, String(testCase.query.reportType)),
      );
      validation.execute("Column Keys Match Rows", () =>
        validator.validateColumnKeysMatchRows(mapped),
      );
      validation.execute("Rows Exist", () => validator.validateRowsExist(mapped));
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Unique Row IDs", () => validator.validateUniqueRowIds(mapped));
      validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, testCase.query));
      validation.execute("Year Echo", () => validator.validateYearEcho(mapped, testCase.query));
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
