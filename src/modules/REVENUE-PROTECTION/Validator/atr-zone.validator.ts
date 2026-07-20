import { expect } from "@playwright/test";
import type { AtrZoneData, AtrZoneQuery, AtrZoneResponse } from "../Mapper/atr-zone.mapper";
import { EXPECTED_ATRZONE_COLUMN_KEYS } from "../Data/atr-zone.data";

export class AtrZoneValidator {
  validateResponse(response: AtrZoneResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: AtrZoneData): void {
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    const keys = data.columns.map((c) => c.key);
    expect(new Set(keys).size).toEqual(keys.length);
    data.columns.forEach((c) => {
      expect(c.key.trim()).not.toEqual("");
      expect(c.header.trim()).not.toEqual("");
    });
    for (const expectedKey of EXPECTED_ATRZONE_COLUMN_KEYS) {
      expect(keys).toContain(expectedKey);
    }
  }

  /** columns[].key must match row keys, excluding `id` (row identity, not a column). */
  validateColumnKeysMatchRows(data: AtrZoneData): void {
    const columnKeys = data.columns.map((c) => c.key).sort();
    for (const expectedKey of EXPECTED_ATRZONE_COLUMN_KEYS) {
      expect(columnKeys).toContain(expectedKey);
    }
    data.rows.forEach((row) => {
      const rowKeys = Object.keys(row)
        .filter((k) => k !== "id")
        .sort();
      expect(rowKeys).toEqual(columnKeys);
    });
  }

  validateRowsExist(data: AtrZoneData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();
    if (data.pagination.total > 0 && data.pagination.page <= data.pagination.totalPages) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }

  validatePagination(data: AtrZoneData): void {
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
    if (totalPages === 1) {
      expect(total).toEqual(data.rows.length);
    }
    if (page < totalPages) {
      expect(data.rows.length).toEqual(limit);
    } else if (page === totalPages) {
      const remainder = total % limit;
      expect(data.rows.length).toEqual(remainder === 0 ? limit : remainder);
    }
  }

  validateUniqueRowIds(data: AtrZoneData): void {
    const ids = data.rows.map((r) => r.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateQueryEcho(data: AtrZoneData, query: AtrZoneQuery): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);
    expect(data.pagination.limit).toEqual(query.limit ?? 10);
  }

  /**
   * ONLY year is guaranteed to match the request — this endpoint has no
   * month filter, so rows legitimately span multiple months (confirmed:
   * sample has APR and MAR rows under year=2026). Do NOT assert month here.
   */
  validateYearEcho(data: AtrZoneData, query: AtrZoneQuery): void {
    const expectedYear = String(query.year).trim();
    data.rows.forEach((row) => {
      expect(row.year).toEqual(expectedYear);
    });
  }

  validateNonNegativeAmounts(data: AtrZoneData): void {
    data.rows.forEach((row) => {
      expect(row.amountBilled).toBeGreaterThanOrEqual(0);
      expect(row.amountRealised).toBeGreaterThanOrEqual(0);
    });
  }

  /**
   * occurrenceTime should never be after restorationTime when both are
   * present — a real business rule the DB layer doesn't enforce for you.
   */
  validateOccurrenceBeforeRestoration(data: AtrZoneData): void {
    data.rows.forEach((row) => {
      if (!row.restorationTime) return;
      const occurred = new Date(row.occurrenceTime);
      const restored = new Date(row.restorationTime);
      if (Number.isNaN(occurred.getTime()) || Number.isNaN(restored.getTime())) return;
      expect(restored.getTime()).toBeGreaterThanOrEqual(occurred.getTime());
    });
  }
}