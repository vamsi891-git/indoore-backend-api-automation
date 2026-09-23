import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { ZoneWiseAtrEventsApi } from "../Api/zone-wise-atr-events.api";
import {
  zoneWiseAtrEventsListTestCases,
  zoneWiseAtrEventsMaxResponseTimeMs,
} from "../Data/zone-wise-atr-events.data";
import { ZoneWiseAtrEventsMapper } from "../Mapper/zone-wise-atr-events.mapper";
import { ZoneWiseAtrEventsValidator } from "../Validator/zone-wise-atr-events.validator";
import { ZoneWiseAtrEventsSuccessResponseSchema } from "../schemas/zone-wise-atr-events.schemas";

test.describe("Revenue Protection — Zone-wise ATR Events list", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of zoneWiseAtrEventsListTestCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new ZoneWiseAtrEventsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getZoneWiseAtrEvents(
        testCase.query,
      );
      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ZoneWiseAtrEventsValidator();
      const mapped = ZoneWiseAtrEventsMapper.mapData(responseBody.data);

      if (testCase.nonEmptyExpected && mapped.pagination.total === 0) {
        test.skip(
          true,
          `No zone-wise ATR events for month=${testCase.query.month} year=${testCase.query.year}`,
        );
      }

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, zoneWiseAtrEventsMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(ZoneWiseAtrEventsSuccessResponseSchema, responseBody),
      );
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Columns", () => validator.validateColumns(mapped));
      validation.execute("Column Keys Match Rows", () =>
        validator.validateColumnKeysMatchRows(mapped),
      );
      validation.execute("Rows Exist", () => validator.validateRowsExist(mapped));
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Unique Row IDs", () => validator.validateUniqueRowIds(mapped));
      validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, testCase.query));
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
