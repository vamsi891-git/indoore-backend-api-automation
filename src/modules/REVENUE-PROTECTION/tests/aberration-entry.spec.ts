import { test } from "../../../fixtures/observability.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import {
  aberrationEntryMaxResponseTimeMs,
  aberrationEntryTestCases,
} from "../Data/aberration-entry.data";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";
import { AberrationEntryValidator } from "../Validator/aberration-entry.validator";
import { AberrationEntrySuccessResponseSchema } from "../schemas/aberration-entry.schemas";
import { logAberrationEntryDataQualityFindings } from "../utils/aberration-entry-data-quality";

test.describe("Revenue Protection — Aberration Entry API", () => {
  test.describe.configure({
    retries: 1,
    mode: "serial",
  });

  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of aberrationEntryTestCases) {
    test(
      testCase.testName,
      { tag: [...testCase.tags] },
      async ({ authenticatedApi, obs }) => {
        await applyAllureTestCaseId(testCase.testCaseId);

        const api = new AberrationEntryApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getAberrationEntry(testCase.query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine(obs);
        const validator = new AberrationEntryValidator();
        const mapped = AberrationEntryMapper.mapData(responseBody.data);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, aberrationEntryMaxResponseTimeMs),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        validation.execute("Schema Validation", () =>
          assertZodSchema(AberrationEntrySuccessResponseSchema, responseBody),
        );
        validation.execute("Response", () => validator.validateResponse(responseBody));
        validation.execute("Columns", () => validator.validateColumns(mapped));
        validation.execute("Column Keys Match Rows", () =>
          validator.validateColumnKeysMatchRows(mapped),
        );
        validation.execute("Rows Exist", () => validator.validateRowsExist(mapped));
        validation.execute("Pagination", () => validator.validatePagination(mapped));
        validation.execute("Unique Row IDs", () =>
          validator.validateUniqueRowIds(mapped),
        );
        validation.execute("Non-Negative Amounts", () =>
          validator.validateNonNegativeAmounts(mapped),
        );
        validation.execute("Query Echo", () =>
          validator.validateQueryEcho(mapped, testCase.query),
        );
        validation.execute("Month Echo", () =>
          validator.validateMonthEcho(mapped, testCase.query),
        );
        validation.execute("Year Echo", () =>
          validator.validateYearEcho(mapped, testCase.query),
        );
        validation.execute("Occurrence Sorting", () =>
          validator.validateOccurrenceSorting(mapped),
        );

        await logAberrationEntryDataQualityFindings(mapped);

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
