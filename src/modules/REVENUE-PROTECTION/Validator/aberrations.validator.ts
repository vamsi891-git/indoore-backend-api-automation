import { expect } from "@playwright/test";
import {AberrationsData,AberrationsQuery,AberrationsResponse,} from "../Mapper/aberrations.mapper";
import { EXPECTED_ABERRATION_COLUMN_KEYS } from "../Data/aberrations.data";
export class AberrationsValidator {
  validateResponse(response: AberrationsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }
  validateColumns(data: AberrationsData): void {
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    const keys = data.columns.map((column) => column.key);
    expect(new Set(keys).size).toEqual(keys.length);
    data.columns.forEach((column) => {
      expect(column.key.trim()).not.toEqual("");
      expect(column.header.trim()).not.toEqual("");
    });
    for (const expectedKey of EXPECTED_ABERRATION_COLUMN_KEYS) {
      expect(keys).toContain(expectedKey);
    }
  }
  validateRowsExist(data: AberrationsData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();
    if (data.pagination.total > 0) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }
  validatePagination(data: AberrationsData): void {
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
      const expectedRows = remainder === 0 ? limit : remainder;
      expect(data.rows.length).toEqual(expectedRows);
    }
  }
  /**
   * Requested rule: the reported total count must match the actual number of
   * records. When every record fits on the requested page (total <= limit),
   * the returned row count must equal pagination.total exactly. In all cases
   * the total can never be smaller than the rows returned on a single page.
   */
  validateTotalCountMatchesRecords(data: AberrationsData): void {
    const { total, limit } = data.pagination;
    expect(total).toBeGreaterThanOrEqual(data.rows.length);
    if (total <= limit) {
      expect(data.rows.length).toEqual(total);
    }
  }
  /** Backend rule: no_of_cases = total_cases_attended + pending. */
  validateCaseCountConsistency(data: AberrationsData): void {
    data.rows.forEach((row) => {
      expect(row.totalCasesAttended + row.pending).toEqual(row.noOfCases);
      expect(row.totalCasesAttended).toBeLessThanOrEqual(row.noOfCases);
      expect(row.pending).toBeLessThanOrEqual(row.noOfCases);
    });
  }
  validateNonNegativeMetrics(data: AberrationsData): void {
    data.rows.forEach((row) => {
      expect(row.noOfCases).toBeGreaterThanOrEqual(0);
      expect(row.totalCasesAttended).toBeGreaterThanOrEqual(0);
      expect(row.pending).toBeGreaterThanOrEqual(0);
      expect(row.amountBilled).toBeGreaterThanOrEqual(0);
      expect(row.amountRealisation).toBeGreaterThanOrEqual(0);
    });
  }

  validateRowFields(data: AberrationsData): void {
    data.rows.forEach((row) => {
      expect(row.id.trim()).not.toEqual("");
      expect(row.circle.trim()).not.toEqual("");
      expect(row.month.trim()).not.toEqual("");
      expect(row.year.trim()).not.toEqual("");
      expect(Number.isFinite(row.noOfCases)).toBeTruthy();
      expect(Number.isFinite(row.totalCasesAttended)).toBeTruthy();
      expect(Number.isFinite(row.pending)).toBeTruthy();
      expect(Number.isFinite(row.amountBilled)).toBeTruthy();
      expect(Number.isFinite(row.amountRealisation)).toBeTruthy();
    });
  }

  validateUniqueRowIds(data: AberrationsData): void {
    const ids = data.rows.map((row) => row.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateQueryEcho(data: AberrationsData, query: AberrationsQuery): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);
    expect(data.pagination.limit).toEqual(query.limit ?? 10);
  }

  validateMonthYearEcho(data: AberrationsData, query: AberrationsQuery): void {
    const expectedMonth = String(query.month).trim().toUpperCase();
    const expectedYear = String(query.year).trim();
    data.rows.forEach((row) => {
      expect(row.month.toUpperCase()).toEqual(expectedMonth);
      expect(row.year).toEqual(expectedYear);
    });
  }
}
