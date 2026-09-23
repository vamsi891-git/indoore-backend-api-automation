import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { AtrReportApi } from "../Api/atr-report.api";
import { atrReportExportTestCases, atrReportMaxResponseTimeMs } from "../Data/atr-report.data";
import { AtrReportMapper } from "../Mapper/atr-report.mapper";
import { AtrReportValidator } from "../Validator/atr-report.validator";
import {
  normalizeAtrReportExportHeaders,
  readAtrReportExportHeaders,
} from "../utils/atr-report-export.helper";

test.describe("Revenue Protection — ATR Report Export", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of atrReportExportTestCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new AtrReportApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new AtrReportValidator();
      const reportType = String(testCase.query.reportType);

      const listResult = await api.getAtrReport(testCase.query);
      expect(listResult.rawResponse.status(), `${reportType} list HTTP`).toBe(200);
      expect(listResult.responseBody.success).toBeTruthy();
      const mapped = AtrReportMapper.mapData(listResult.responseBody.data);
      const apiHeaders = mapped.columns.map((column) => column.header);

      if (testCase.nonEmptyExpected && mapped.pagination.total === 0) {
        throw new Error(
          `${reportType}: list has total=0 for year=${testCase.query.year} — cannot validate export headers against empty org data`,
        );
      }

      const exportResult = await api.exportAtrReport(testCase.query);
      await PerformanceTracker.track(
        exportResult.rawResponse,
        testCase.testName,
        exportResult.rawResponse.url(),
        exportResult.responseTime,
      );

      const bodyPreview = exportResult.body.slice(0, 240).toString("utf8");
      expect(
        exportResult.rawResponse.status(),
        `${reportType}: export must return HTTP 200 with xlsx (got ${exportResult.rawResponse.status()} ${exportResult.contentType}). Body: ${bodyPreview}`,
      ).toBe(200);
      expect(
        exportResult.contentType,
        `${reportType}: content-type must be spreadsheet xlsx`,
      ).toMatch(/spreadsheetml|octet-stream|excel/i);
      expect(
        exportResult.contentDisposition.toLowerCase(),
        `${reportType}: content-disposition must include attachment filename`,
      ).toContain("attachment");
      expect(exportResult.contentDisposition.toLowerCase()).toContain("filename=");
      expect(
        exportResult.body.slice(0, 2).toString("utf8"),
        `${reportType}: export body must start with PK (xlsx zip). Body: ${bodyPreview}`,
      ).toEqual("PK");

      validation.execute("Export Response Time", () =>
        assert.validateResponseTime(exportResult.responseTime, atrReportMaxResponseTimeMs),
      );

      const excelHeadersRaw = await readAtrReportExportHeaders(exportResult.body);
      const excelHeaders = normalizeAtrReportExportHeaders(excelHeadersRaw);

      console.log(
        `[${reportType}] apiHeaders=${JSON.stringify(apiHeaders)} excelHeaders=${JSON.stringify(excelHeadersRaw)}`,
      );

      validation.execute("Export Headers Match List API", () =>
        validator.validateExportHeadersMatchApi(apiHeaders, excelHeaders, reportType),
      );
      validation.printSummary(testCase.testName, exportResult.responseTime);
    });
  }
});
