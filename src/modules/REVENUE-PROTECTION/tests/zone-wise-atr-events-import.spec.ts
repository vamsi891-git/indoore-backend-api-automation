import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { ZoneWiseAtrEventsApi } from "../Api/zone-wise-atr-events.api";
import {
  ZONE_WISE_ATR_EVENTS_MONTH,
  ZONE_WISE_ATR_EVENTS_YEAR,
  zoneWiseAtrEventsMaxResponseTimeMs,
} from "../Data/zone-wise-atr-events.data";
import { ZoneWiseAtrEventsMapper } from "../Mapper/zone-wise-atr-events.mapper";
import { ZoneWiseAtrEventsValidator } from "../Validator/zone-wise-atr-events.validator";
import { ZoneWiseAtrEventsImportSuccessResponseSchema } from "../schemas/zone-wise-atr-events.schemas";
import { buildZoneWiseAtrEventsUploadBuffer } from "../utils/zone-wise-atr-events-upload.helper";

/**
 * WRITE / mutating — skipped by default (playwright.config skippedWriteSpecs).
 * To enable: remove this file from skippedWriteSpecs and change describe.skip → describe.
 * Do not run against production.
 */
test.describe.skip("Revenue Protection — Zone-wise ATR Events import", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    "POST /zone-wise-atr-events/import — one-row xlsx completes (import or duplicate skip)",
    {
      tag: ["@zone-wise-atr-events", "@zone-wise-atr-events-import", "@revenue-protection"],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ZW-ATR-IMP-001");
      const api = new ZoneWiseAtrEventsApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ZoneWiseAtrEventsValidator();

      const uniqueIvrs = `AUTO${Date.now().toString().slice(-10)}`;
      const upload = await buildZoneWiseAtrEventsUploadBuffer({
        ivrsNumber: uniqueIvrs,
        eventName: "Zero Consumption",
        occurrenceTime: "01-10-2025 12:00",
        remark: "Automation zone-wise ATR import sample",
      });

      const { rawResponse, responseBody, responseTime } = await api.importZoneWiseAtrEvents({
        month: ZONE_WISE_ATR_EVENTS_MONTH,
        year: ZONE_WISE_ATR_EVENTS_YEAR,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        buffer: upload.buffer,
      });

      await PerformanceTracker.track(
        rawResponse,
        "zone-wise-atr-events import",
        rawResponse.url(),
        responseTime,
      );

      expect(rawResponse.status(), JSON.stringify(responseBody)).toBe(200);
      expect(responseBody.success).toBeTruthy();

      validation.execute("Schema Validation", () =>
        assertZodSchema(ZoneWiseAtrEventsImportSuccessResponseSchema, responseBody),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, zoneWiseAtrEventsMaxResponseTimeMs),
      );

      const mapped = ZoneWiseAtrEventsMapper.mapImport(responseBody.data);
      validation.execute("Import Completed", () => validator.validateImportCompleted(mapped));
      validation.printSummary("zone-wise-atr-events import", responseTime);

      console.log(
        JSON.stringify({
          ivrs: uniqueIvrs,
          uploadId: mapped.uploadId,
          status: mapped.status,
          importedRecords: mapped.importedRecords,
          skippedDuplicateRows: mapped.skippedDuplicateRows,
        }),
      );
    },
  );
});
