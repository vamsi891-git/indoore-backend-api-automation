import { expect } from "@playwright/test";
import type {
  AtrReportData,
  AtrReportQuery,
  AtrReportResponse,
  AtrReportType,
} from "../Mapper/atr-report.mapper";
import { EXPECTED_ATR_REPORT_COLUMNS } from "../Data/atr-report.data";

export class AtrReportValidator {
  validateResponse(response: AtrReportResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: AtrReportData, reportType: string): void {
    const expected = EXPECTED_ATR_REPORT_COLUMNS[reportType as AtrReportType];
    expect(
      expected,
      `Unknown atr-report reportType "${reportType}" — add EXPECTED_ATR_REPORT_COLUMNS entry`,
    ).toBeDefined();
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    const keys = data.columns.map((c) => c.key);
    expect(new Set(keys).size).toEqual(keys.length);
    data.columns.forEach((column) => {
      expect(column.key.trim()).not.toEqual("");
      expect(column.header.trim()).not.toEqual("");
    });
    for (const col of expected) {
      expect(keys, `missing column key ${col.key}`).toContain(col.key);
      const found = data.columns.find((c) => c.key === col.key);
      expect(found?.header, `header for ${col.key}`).toEqual(col.header);
    }
  }

  validateColumnKeysMatchRows(data: AtrReportData): void {
    const columnKeys = data.columns.map((c) => c.key);
    data.rows.forEach((row) => {
      const rowKeys = Object.keys(row);
      for (const key of columnKeys) {
        expect(rowKeys, `row ${row.id} missing column key ${key}`).toContain(key);
      }
    });
  }

  validateRowsExist(data: AtrReportData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();
    if (data.pagination.total > 0 && data.pagination.page <= data.pagination.totalPages) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }

  validatePagination(data: AtrReportData): void {
    const { page, limit, total, totalPages } = data.pagination;
    expect(page).toBeGreaterThan(0);
    expect(limit).toBeGreaterThan(0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(totalPages).toBeGreaterThanOrEqual(0);
    expect(data.rows.length).toBeLessThanOrEqual(limit);
    if (total === 0) {
      expect(totalPages).toEqual(0);
      expect(data.rows.length).toEqual(0);
      return;
    }
    expect(totalPages).toEqual(Math.ceil(total / limit));
    if (page < totalPages) {
      expect(data.rows.length).toEqual(limit);
    } else if (page === totalPages) {
      const remainder = total % limit;
      expect(data.rows.length).toEqual(remainder === 0 ? limit : remainder);
    }
  }

  validateUniqueRowIds(data: AtrReportData): void {
    const ids = data.rows.map((row) => row.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateQueryEcho(data: AtrReportData, query: AtrReportQuery): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);
    expect(data.pagination.limit).toEqual(query.limit ?? 10);
  }

  validateYearEcho(data: AtrReportData, query: AtrReportQuery): void {
    if (query.year === undefined || query.year === "") {
      return;
    }
    const expectedYear = String(query.year);
    data.rows.forEach((row) => {
      if (!("year" in row)) {
        return;
      }
      expect(String(row.year)).toEqual(expectedYear);
    });
  }

  /**
   * Excel headers (after optional leading S.No) must equal list API column headers
   * in the same order — any mismatch is a hard fail.
   */
  validateExportHeadersMatchApi(
    apiHeaders: string[],
    excelHeaders: string[],
    reportType: string,
  ): void {
    expect(apiHeaders.length, `${reportType}: list API returned no column headers`).toBeGreaterThan(
      0,
    );
    expect(excelHeaders.length, `${reportType}: export file returned no headers`).toBeGreaterThan(
      0,
    );
    expect(
      excelHeaders,
      `${reportType}: export headers must equal list API headers.\nAPI: ${JSON.stringify(apiHeaders)}\nXLSX: ${JSON.stringify(excelHeaders)}`,
    ).toEqual(apiHeaders);
  }
}
