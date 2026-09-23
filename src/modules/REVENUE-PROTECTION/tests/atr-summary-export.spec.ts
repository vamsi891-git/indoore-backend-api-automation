import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { AtrSummaryApi } from "../Api/atr-summary.api";
import {
  atrSummaryExportTestCases,
  atrSummaryDetailsExportTestCases,
  atrSummaryMaxResponseTimeMs,
} from "../Data/atr-summary.data";
import { AtrSummaryMapper } from "../Mapper/atr-summary.mapper";
import { AtrSummaryValidator } from "../Validator/atr-summary.validator";
import {
  normalizeAtrSummaryExportHeaders,
  readAtrSummaryExportHeaders,
} from "../utils/atr-summary-export.helper";

test.describe("Revenue Protection — ATR Summary Export", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of atrSummaryExportTestCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new AtrSummaryApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new AtrSummaryValidator();
      const label = `${testCase.query.reportType}/${testCase.query.hierarchyLevel}`;

      const listResult = await api.getAtrSummary(testCase.query);
      expect(listResult.rawResponse.status(), `${label} list HTTP`).toBe(200);
      expect(listResult.responseBody.success).toBeTruthy();
      const mapped = AtrSummaryMapper.mapData(listResult.responseBody.data);
      const apiHeaders = mapped.columns.map((column) => column.header);

      if (testCase.nonEmptyExpected && mapped.pagination.total === 0) {
        throw new Error(
          `${label}: list has total=0 for year=${testCase.query.year} — cannot validate export headers against empty data`,
        );
      }

      const exportResult = await api.exportAtrSummary(testCase.query);
      await PerformanceTracker.track(
        exportResult.rawResponse,
        testCase.testName,
        exportResult.rawResponse.url(),
        exportResult.responseTime,
      );

      const bodyPreview = exportResult.body.slice(0, 240).toString("utf8");
      expect(
        exportResult.rawResponse.status(),
        `${label}: export must return HTTP 200 with xlsx (got ${exportResult.rawResponse.status()} ${exportResult.contentType}). Body: ${bodyPreview}`,
      ).toBe(200);
      expect(exportResult.contentType, `${label}: content-type must be spreadsheet xlsx`).toMatch(
        /spreadsheetml|octet-stream|excel/i,
      );
      expect(
        exportResult.contentDisposition.toLowerCase(),
        `${label}: content-disposition must include attachment filename`,
      ).toContain("attachment");
      expect(exportResult.contentDisposition.toLowerCase()).toContain("filename=");
      expect(
        exportResult.body.slice(0, 2).toString("utf8"),
        `${label}: export body must start with PK (xlsx zip). Body: ${bodyPreview}`,
      ).toEqual("PK");

      validation.execute("Export Response Time", () =>
        assert.validateResponseTime(exportResult.responseTime, atrSummaryMaxResponseTimeMs),
      );

      const excelHeadersRaw = await readAtrSummaryExportHeaders(exportResult.body);
      const excelHeaders = normalizeAtrSummaryExportHeaders(excelHeadersRaw);

      console.log(
        `[${label}] apiHeaders=${JSON.stringify(apiHeaders)} excelHeaders=${JSON.stringify(excelHeadersRaw)}`,
      );

      validation.execute("Export Headers Match List API", () =>
        validator.validateExportHeadersMatchApi(apiHeaders, excelHeaders, label),
      );
      validation.printSummary(testCase.testName, exportResult.responseTime);
    });
  }
});

test.describe("Revenue Protection — ATR Summary Details Export", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of atrSummaryDetailsExportTestCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new AtrSummaryApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new AtrSummaryValidator();
      const label = `details/${testCase.query.reportType}`;

      const listResult = await api.getAtrSummaryDetails(testCase.query);
      expect(listResult.rawResponse.status(), `${label} list HTTP`).toBe(200);
      expect(listResult.responseBody.success).toBeTruthy();
      const mapped = AtrSummaryMapper.mapData(listResult.responseBody.data);
      const apiHeaders = mapped.columns.map((column) => column.header);

      if (testCase.nonEmptyExpected && mapped.pagination.total === 0) {
        throw new Error(
          `${label}: list has total=0 for year=${testCase.query.year} month=${testCase.query.month} — cannot validate export headers`,
        );
      }

      const exportResult = await api.exportAtrSummaryDetails(testCase.query);
      await PerformanceTracker.track(
        exportResult.rawResponse,
        testCase.testName,
        exportResult.rawResponse.url(),
        exportResult.responseTime,
      );

      const bodyPreview = exportResult.body.slice(0, 240).toString("utf8");
      expect(
        exportResult.rawResponse.status(),
        `${label}: export must return HTTP 200 with xlsx (got ${exportResult.rawResponse.status()} ${exportResult.contentType}). Body: ${bodyPreview}`,
      ).toBe(200);
      expect(exportResult.contentType, `${label}: content-type must be spreadsheet xlsx`).toMatch(
        /spreadsheetml|octet-stream|excel/i,
      );
      expect(
        exportResult.contentDisposition.toLowerCase(),
        `${label}: content-disposition must include attachment filename`,
      ).toContain("attachment");
      expect(exportResult.contentDisposition.toLowerCase()).toContain("filename=");
      expect(
        exportResult.body.slice(0, 2).toString("utf8"),
        `${label}: export body must start with PK (xlsx zip). Body: ${bodyPreview}`,
      ).toEqual("PK");

      validation.execute("Export Response Time", () =>
        assert.validateResponseTime(exportResult.responseTime, atrSummaryMaxResponseTimeMs),
      );

      const excelHeadersRaw = await readAtrSummaryExportHeaders(exportResult.body);
      const excelHeaders = normalizeAtrSummaryExportHeaders(excelHeadersRaw);

      console.log(
        `[${label}] apiHeaders=${JSON.stringify(apiHeaders)} excelHeaders=${JSON.stringify(excelHeadersRaw)}`,
      );

      validation.execute("Export Headers Match List API", () =>
        validator.validateExportHeadersMatchApi(apiHeaders, excelHeaders, label),
      );
      validation.printSummary(testCase.testName, exportResult.responseTime);
    });
  }
});
