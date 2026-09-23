import { expect } from "@playwright/test";
import type {
  ZoneWiseAtrEventsData,
  ZoneWiseAtrEventsImportResult,
  ZoneWiseAtrEventsQuery,
  ZoneWiseAtrEventsResponse,
} from "../Mapper/zone-wise-atr-events.types";
import { EXPECTED_ZONE_WISE_ATR_EVENTS_COLUMNS } from "../Data/zone-wise-atr-events.data";

export class ZoneWiseAtrEventsValidator {
  validateResponse(response: ZoneWiseAtrEventsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: ZoneWiseAtrEventsData): void {
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);
    const keys = data.columns.map((c) => c.key);
    expect(new Set(keys).size).toEqual(keys.length);
    for (const col of EXPECTED_ZONE_WISE_ATR_EVENTS_COLUMNS) {
      expect(keys, `missing column key ${col.key}`).toContain(col.key);
      const found = data.columns.find((c) => c.key === col.key);
      expect(found?.header, `header for ${col.key}`).toEqual(col.header);
    }
  }

  validateColumnKeysMatchRows(data: ZoneWiseAtrEventsData): void {
    const columnKeys = data.columns.map((c) => c.key);
    data.rows.forEach((row) => {
      const rowKeys = Object.keys(row);
      for (const key of columnKeys) {
        expect(rowKeys, `row ${row.id} missing column key ${key}`).toContain(key);
      }
    });
  }

  validateRowsExist(data: ZoneWiseAtrEventsData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();
    if (data.pagination.total > 0 && data.pagination.page <= data.pagination.totalPages) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }

  validatePagination(data: ZoneWiseAtrEventsData): void {
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
  }

  validateUniqueRowIds(data: ZoneWiseAtrEventsData): void {
    const ids = data.rows.map((row) => row.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateQueryEcho(data: ZoneWiseAtrEventsData, query: ZoneWiseAtrEventsQuery): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);
    expect(data.pagination.limit).toEqual(query.limit ?? 20);
    const expectedMonth = String(query.month);
    const expectedYear = String(query.year);
    data.rows.forEach((row) => {
      expect(String(row.month)).toEqual(expectedMonth);
      expect(String(row.year)).toEqual(expectedYear);
    });
  }

  /**
   * Import completed successfully: either newly imported or skipped as duplicate.
   * Matches live Swagger result shape (uploadId, status COMPLETED, counts).
   */
  validateImportCompleted(result: ZoneWiseAtrEventsImportResult): void {
    expect(result.uploadId.trim()).not.toEqual("");
    expect(result.submissionId.trim()).not.toEqual("");
    expect(result.status.toUpperCase()).toEqual("COMPLETED");
    expect(result.totalRows).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
    const accepted = result.importedRecords > 0 || result.skippedDuplicateRows > 0;
    expect(
      accepted,
      `expected importedRecords>0 or skippedDuplicateRows>0; got imported=${result.importedRecords} duplicates=${result.skippedDuplicateRows} failed=${result.failedRecords}`,
    ).toBeTruthy();
    expect(result.failedRecords).toEqual(0);
    expect(result.invalidRecords).toEqual(0);
  }
}
