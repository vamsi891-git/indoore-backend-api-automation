import { expect } from "@playwright/test";
import type {
  AtrSummaryData,
  AtrSummaryHierarchyLevel,
  AtrSummaryQuery,
  AtrSummaryRow,
} from "../Mapper/atr-summary.types";
import {
  EXPECTED_DIVISION_NAMES,
  expectedBillingEfficiencyColumns,
} from "../Data/atr-summary.data";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  expect(Number.isFinite(parsed), `expected finite number, got ${String(value)}`).toBeTruthy();
  return parsed;
}

export class AtrSummaryValidator {
  validateResponse(response: { success?: boolean; data?: unknown }): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateBillingEfficiencyColumns(
    data: AtrSummaryData,
    level: Exclude<AtrSummaryHierarchyLevel, "dtr">,
  ): void {
    const expected = expectedBillingEfficiencyColumns(level);
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

  validateColumnKeysMatchRows(data: AtrSummaryData): void {
    const columnKeys = data.columns.map((c) => c.key);
    data.rows.forEach((row) => {
      const rowKeys = Object.keys(row);
      for (const key of columnKeys) {
        expect(rowKeys, `row ${row.id} missing column key ${key}`).toContain(key);
      }
    });
  }

  validateRowsExist(data: AtrSummaryData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();
    if (data.pagination.total > 0 && data.pagination.page <= data.pagination.totalPages) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }

  validatePagination(data: AtrSummaryData): void {
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

  validateUniqueRowIds(data: AtrSummaryData): void {
    const ids = data.rows.map((row) => row.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateQueryEcho(data: AtrSummaryData, query: AtrSummaryQuery): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);
    expect(data.pagination.limit).toEqual(query.limit ?? 20);
    expect(data.context.reportType).toEqual(String(query.reportType));
    expect(data.context.level).toEqual(String(query.hierarchyLevel));
    if (query.parentId === undefined || query.parentId === "") {
      expect(data.context.parentId).toBeNull();
    } else {
      expect(data.context.parentId).toEqual(String(query.parentId));
    }
  }

  validateLevelEcho(data: AtrSummaryData, level: string): void {
    data.rows.forEach((row) => {
      expect(String(row.level)).toEqual(level);
      expect(String(row.reportType)).toEqual(data.context.reportType);
    });
  }

  validateExpectedDivisions(data: AtrSummaryData): void {
    expect(data.rows.length).toEqual(EXPECTED_DIVISION_NAMES.length);
    const names = data.rows
      .map((row) => String(row.division ?? row.hierarchyLabel ?? "").trim())
      .sort((a, b) => a.localeCompare(b));
    const expected = [...EXPECTED_DIVISION_NAMES].sort((a, b) => a.localeCompare(b));
    expect(names, `Expected 5 divisions ${expected.join(", ")}; got ${names.join(", ")}`).toEqual(
      expected,
    );
  }

  /**
   * Child rows unitsGain sum must equal parent totals.unitsGain (hard fail).
   * When parentTotals is null (e.g. feeder), skip.
   */
  validateUnitsGainChildSum(
    parentTotalsUnitsGain: number | null | undefined,
    childRows: AtrSummaryRow[],
    label: string,
  ): void {
    if (parentTotalsUnitsGain === null || parentTotalsUnitsGain === undefined) {
      return;
    }
    const childSum = childRows.reduce((sum, row) => sum + toNumber(row.unitsGain), 0);
    expect(
      childSum,
      `${label}: child unitsGain sum (${childSum}) must equal parent totals.unitsGain (${parentTotalsUnitsGain})`,
    ).toEqual(toNumber(parentTotalsUnitsGain));
  }

  /**
   * Excel headers (after optional leading S.No) must equal list API column headers
   * in the same order — any mismatch is a hard fail.
   */
  validateExportHeadersMatchApi(apiHeaders: string[], excelHeaders: string[], label: string): void {
    expect(apiHeaders.length, `${label}: list API returned no column headers`).toBeGreaterThan(0);
    expect(excelHeaders.length, `${label}: export file returned no headers`).toBeGreaterThan(0);
    expect(
      excelHeaders,
      `${label}: export headers must equal list API headers.\nAPI: ${JSON.stringify(apiHeaders)}\nXLSX: ${JSON.stringify(excelHeaders)}`,
    ).toEqual(apiHeaders);
  }
}
