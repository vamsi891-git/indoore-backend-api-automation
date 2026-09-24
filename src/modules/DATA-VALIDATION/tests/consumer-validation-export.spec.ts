import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { ConsumerValidationApi } from "../Api/consumer-validation.api";
import { ConsumerValidationExportApi } from "../Api/consumer-validation-export.api";
import {
  consumerValidationDefaultQuery,
  consumerValidationExportDefaultQuery,
  consumerValidationExportMaxResponseTimeMs,
} from "../Data/consumer-validation.data";
import { ConsumerValidationMapper } from "../Mapper/consumer-validation.mapper";
import { parseConsumerValidationExport } from "../Utils/consumer-validation-export.helper";
import { ConsumerValidationValidator } from "../Validator/consumer-validation.validator";

test.describe("Data Validation — Consumer Validation Export", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(240_000);

  test(
    "GET /data-validation/consumer-validation/export — xlsx headers match list + no duplicates",
    { tag: ["@smoke", "@data-validation", "@consumer-validation", "@export"] },
    async ({ authenticatedApi }) => {
      const listApi = new ConsumerValidationApi(authenticatedApi);
      const exportApi = new ConsumerValidationExportApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ConsumerValidationValidator();

      const listResult = await listApi.getConsumerValidation(consumerValidationDefaultQuery);
      expect(listResult.rawResponse.status(), "list HTTP").toBe(200);
      expect(listResult.responseBody.success).toBeTruthy();

      const listData = ConsumerValidationMapper.mapData(listResult.responseBody.data);
      const listHeaders = listData.columns.map((column) => column.header);
      expect(listData.rows.length, "list must have rows to compare export").toBeGreaterThan(0);

      validation.execute("List No Duplicate Rows", () =>
        validator.validateNoDuplicateRows(listData.rows),
      );

      const exportResult = await exportApi.exportConsumerValidation(
        consumerValidationExportDefaultQuery,
      );
      await PerformanceTracker.track(
        exportResult.rawResponse,
        "Consumer Validation Export",
        exportResult.rawResponse.url(),
        exportResult.responseTime,
      );

      const bodyPreview = exportResult.body.slice(0, 240).toString("utf8");
      expect(
        exportResult.rawResponse.status(),
        `export must return HTTP 200 with xlsx (got ${exportResult.rawResponse.status()} ${exportResult.contentType}). Body: ${bodyPreview}`,
      ).toBe(200);
      expect(
        exportResult.body.slice(0, 2).toString("utf8"),
        `export body must start with PK (xlsx zip). Body: ${bodyPreview}`,
      ).toEqual("PK");

      validation.execute("Download Headers", () =>
        validator.validateDownloadHeaders(
          exportResult.contentType,
          exportResult.contentDisposition,
        ),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(
          exportResult.responseTime,
          consumerValidationExportMaxResponseTimeMs,
        ),
      );

      const parsed = await parseConsumerValidationExport(exportResult.body);
      validation.execute("Export Headers Match List API", () =>
        validator.validateExportHeadersMatchList(listHeaders, parsed.headers),
      );
      validation.execute("Export Not Empty", () => validator.validateExportNotEmpty(parsed.rows));
      validation.execute("Export No Duplicate Rows", () =>
        validator.validateExportNoDuplicateRows(parsed.rows),
      );

      validation.printSummary("Consumer Validation Export", exportResult.responseTime);
    },
  );
});
