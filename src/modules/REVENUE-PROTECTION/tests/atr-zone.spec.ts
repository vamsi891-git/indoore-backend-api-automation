import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AtrZoneApi } from "../Api/atr-zone.api";
import { atrZoneMaxResponseTimeMs, atrZoneTestCases } from "../Data/atr-zone.data";
import { AtrZoneMapper } from "../Mapper/atr-zone.mapper";
import { AtrZoneSuccessResponseSchema } from "../schemas/atr-zone.schemas";
import { AtrZoneValidator } from "../Validator/atr-zone.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { logAtrZoneDataQualityFindings } from "../utils/atr-zone-data-quality";

test.describe("Revenue Protection — ATR Zone API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of atrZoneTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);

      const api = new AtrZoneApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getAtrZone(testCase.query);

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AtrZoneValidator();
      const mapped = AtrZoneMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, atrZoneMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AtrZoneSuccessResponseSchema, responseBody),
      );
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Columns", () => validator.validateColumns(mapped));
      validation.execute("Column Keys Match Rows", () => validator.validateColumnKeysMatchRows(mapped));
      validation.execute("Rows Exist", () => validator.validateRowsExist(mapped));
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Unique Row IDs", () => validator.validateUniqueRowIds(mapped));
      validation.execute("Non-Negative Amounts", () => validator.validateNonNegativeAmounts(mapped));
      validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, testCase.query));
      validation.execute("Year Echo", () => validator.validateYearEcho(mapped, testCase.query));
      validation.execute("Occurrence Before Restoration", () =>
        validator.validateOccurrenceBeforeRestoration(mapped),
      );

      await logAtrZoneDataQualityFindings(mapped);

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});