import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { ZoneWiseAtrUploadsApi } from "../Api/zone-wise-atr-uploads.api";
import {
  ZONE_WISE_ATR_UPLOADS_MONTH,
  ZONE_WISE_ATR_UPLOADS_YEAR,
  zoneWiseAtrUploadsMaxResponseTimeMs,
  zoneWiseAtrUploadsSummaryQuery,
  zoneWiseAtrUploadsTestCases,
} from "../Data/zone-wise-atr-uploads.data";
import { ZoneWiseAtrUploadsMapper } from "../Mapper/zone-wise-atr-uploads.mapper";
import { ZoneWiseAtrUploadsValidator } from "../Validator/zone-wise-atr-uploads.validator";
import {
  ZoneWiseAtrUploadsSuccessResponseSchema,
  ZoneWiseAtrUploadsSummarySuccessResponseSchema,
} from "../schemas/zone-wise-atr-uploads.schemas";

test.describe("Revenue Protection — Zone-wise ATR Uploads", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of zoneWiseAtrUploadsTestCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new ZoneWiseAtrUploadsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getZoneWiseAtrUploads(
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
      const validator = new ZoneWiseAtrUploadsValidator();
      const mapped = ZoneWiseAtrUploadsMapper.mapData(responseBody.data);

      if (testCase.nonEmptyExpected && mapped.total === 0) {
        test.skip(
          true,
          `No zone-wise ATR uploads for month=${testCase.query.month} year=${testCase.query.year} status=${testCase.query.status}`,
        );
      }

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, zoneWiseAtrUploadsMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(ZoneWiseAtrUploadsSuccessResponseSchema, responseBody),
      );
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Items Exist", () => validator.validateItemsExist(mapped));
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Unique Upload IDs", () => validator.validateUniqueUploadIds(mapped));
      validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, testCase.query));
      validation.execute("Status Allowed", () => validator.validateStatusAllowed(mapped));
      validation.execute("Item Fields", () => validator.validateItemFields(mapped));
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    `Fetch zone-wise ATR uploads summary — ${ZONE_WISE_ATR_UPLOADS_YEAR}-${String(ZONE_WISE_ATR_UPLOADS_MONTH).padStart(2, "0")}`,
    {
      tag: [
        "@smoke",
        "@zone-wise-atr-uploads",
        "@zone-wise-atr-uploads-summary",
        "@revenue-protection",
      ],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ZW-UPL-SUM-001");
      const api = new ZoneWiseAtrUploadsApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ZoneWiseAtrUploadsValidator();

      const summaryResult = await api.getZoneWiseAtrUploadsSummary(zoneWiseAtrUploadsSummaryQuery);
      await PerformanceTracker.track(
        summaryResult.rawResponse,
        "zone-wise-atr-uploads summary",
        summaryResult.rawResponse.url(),
        summaryResult.responseTime,
      );

      const listAll = await api.getZoneWiseAtrUploads({
        ...zoneWiseAtrUploadsSummaryQuery,
        page: 1,
        limit: 10,
      });
      const listCompleted = await api.getZoneWiseAtrUploads({
        ...zoneWiseAtrUploadsSummaryQuery,
        status: "COMPLETED",
        page: 1,
        limit: 10,
      });

      const summary = ZoneWiseAtrUploadsMapper.mapSummary(summaryResult.responseBody.data);
      const allMapped = ZoneWiseAtrUploadsMapper.mapData(listAll.responseBody.data);
      const completedMapped = ZoneWiseAtrUploadsMapper.mapData(listCompleted.responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(summaryResult.rawResponse, 200, summaryResult.responseBody),
      );
      validation.execute("Content Validation", () =>
        assert.validateContentType(summaryResult.rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(
          summaryResult.responseTime,
          zoneWiseAtrUploadsMaxResponseTimeMs,
        ),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(ZoneWiseAtrUploadsSummarySuccessResponseSchema, summaryResult.responseBody),
      );
      validation.execute("Summary Response", () =>
        validator.validateSummaryResponse(summaryResult.responseBody),
      );
      validation.execute("Summary Counts", () => validator.validateSummaryCounts(summary));
      validation.execute("Summary Matches List", () =>
        validator.validateSummaryMatchesList(summary, allMapped.total, completedMapped.total),
      );
      validation.printSummary("zone-wise-atr-uploads summary", summaryResult.responseTime);
    },
  );
});
