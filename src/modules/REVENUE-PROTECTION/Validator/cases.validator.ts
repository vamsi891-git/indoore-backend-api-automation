import { expect } from "@playwright/test";
import type { CasesData, CasesQuery, CasesResponse } from "../Mapper/cases.mapper";
import { EXPECTED_CASE_COLUMN_KEYS } from "../Data/cases.data";

export class CasesValidator {
  validateResponse(response: CasesResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: CasesData): void {
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    const keys = data.columns.map((column) => column.key);
    expect(new Set(keys).size).toEqual(keys.length);
    data.columns.forEach((column) => {
      expect(column.key.trim()).not.toEqual("");
      expect(column.header.trim()).not.toEqual("");
    });
    for (const expectedKey of EXPECTED_CASE_COLUMN_KEYS) {
      expect(keys).toContain(expectedKey);
    }
  }

  /**
   * columns[].key must match keys present on every row object,
   * excluding `id` which is row identity and omitted from column metadata.
   */
  validateColumnKeysMatchRows(data: CasesData): void {
    const columnKeys = data.columns.map((column) => column.key).sort();
    for (const expectedKey of EXPECTED_CASE_COLUMN_KEYS) {
      expect(columnKeys).toContain(expectedKey);
    }
    data.rows.forEach((row) => {
      const rowKeys = Object.keys(row)
        .filter((key) => key !== "id")
        .sort();
      expect(rowKeys).toEqual(columnKeys);
    });
  }

  validateRowsExist(data: CasesData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();
    if (data.pagination.total > 0 && data.pagination.page <= data.pagination.totalPages) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }

  validatePagination(data: CasesData): void {
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

    /** Single-page result: total must equal returned row count. */
    if (totalPages === 1) {
      expect(total).toEqual(data.rows.length);
    }

    if (page < totalPages) {
      expect(data.rows.length).toEqual(limit);
    } else if (page === totalPages) {
      const remainder = total % limit;
      const expectedRows = remainder === 0 ? limit : remainder;
      expect(data.rows.length).toEqual(expectedRows);
    }
  }

  validateUniqueRowIds(data: CasesData): void {
    const ids = data.rows.map((row) => row.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateQueryEcho(data: CasesData, query: CasesQuery): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);
    expect(data.pagination.limit).toEqual(query.limit ?? 10);
  }

  /** Every row's month/year must echo the request filters. */
  validateMonthYearEcho(data: CasesData, query: CasesQuery): void {
    const expectedMonth = String(query.month).trim().toUpperCase();
    const expectedYear = String(query.year).trim();
    data.rows.forEach((row) => {
      expect(row.month.toUpperCase()).toEqual(expectedMonth);
      expect(row.year).toEqual(expectedYear);
    });
  }

  validateNonNegativeAmounts(data: CasesData): void {
    data.rows.forEach((row) => {
      expect(row.amountBilled).toBeGreaterThanOrEqual(0);
      expect(row.amountRealisation).toBeGreaterThanOrEqual(0);
    });
  }
}
