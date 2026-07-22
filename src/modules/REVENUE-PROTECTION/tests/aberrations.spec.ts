import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AberrationsApi } from "../Api/aberrations.api";
import {aberrationsMaxResponseTimeMs,aberrationsTestCases,} from "../Data/aberrations.data";
import { AberrationsMapper } from "../Mapper/aberrations.mapper";
import { AberrationsValidator } from "../Validator/aberrations.validator";
import { AberrationsSuccessResponseSchema } from "../schemas/revenue-protection.schemas";
test.describe("Revenue Protection — Aberrations Summary API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  for (const testCase of aberrationsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AberrationsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationSummary(testCase.query);
      await PerformanceTracker.track(rawResponse,testCase.testName,rawResponse.url(),responseTime,);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AberrationsValidator();
      const mapped = AberrationsMapper.mapData(responseBody.data);
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Validation", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, aberrationsMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AberrationsSuccessResponseSchema, responseBody),
      );
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Columns", () => validator.validateColumns(mapped));
      validation.execute("Rows Exist", () => validator.validateRowsExist(mapped));
      validation.execute("Pagination", () =>
        validator.validatePagination(mapped),
      );
      validation.execute("Total Count Matches Records", () =>
        validator.validateTotalCountMatchesRecords(mapped),
      );
      validation.execute("Case Count Consistency", () =>
        validator.validateCaseCountConsistency(mapped),
      );
      validation.execute("Non-Negative Metrics", () =>
        validator.validateNonNegativeMetrics(mapped),
      );
      validation.execute("Row Fields", () => validator.validateRowFields(mapped));
      validation.execute("Unique Row IDs", () =>
        validator.validateUniqueRowIds(mapped),
      );
      validation.execute("Query Echo", () =>
        validator.validateQueryEcho(mapped, testCase.query),
      );
      validation.execute("Month/Year Echo", () =>
        validator.validateMonthYearEcho(mapped, testCase.query),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
