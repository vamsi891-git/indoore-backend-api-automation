import { expect } from "@playwright/test";
import type {
  AberrationEntryData,
  AberrationEntryQuery,
  AberrationEntryResponse,
} from "../Mapper/aberration-entry.mapper";
import { EXPECTED_ABERRATION_ENTRY_COLUMN_KEYS } from "../Data/aberration-entry.data";

export class AberrationEntryValidator {
  validateResponse(response: AberrationEntryResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: AberrationEntryData): void {
    expect(Array.isArray(data.columns)).toBeTruthy();
    expect(data.columns.length).toBeGreaterThan(0);

    const keys = data.columns.map((c) => c.key);

    expect(new Set(keys).size).toEqual(keys.length);

    data.columns.forEach((column) => {
      expect(column.key.trim()).not.toEqual("");
      expect(column.header.trim()).not.toEqual("");
    });

    for (const expectedKey of EXPECTED_ABERRATION_ENTRY_COLUMN_KEYS) {
      expect(keys).toContain(expectedKey);
    }
  }

  /**
   * Every row should expose exactly the same keys
   * as defined in columns[].
   */
  validateColumnKeysMatchRows(data: AberrationEntryData): void {
    const columnKeys = data.columns.map((c) => c.key).sort();

    for (const expected of EXPECTED_ABERRATION_ENTRY_COLUMN_KEYS) {
      expect(columnKeys).toContain(expected);
    }

    data.rows.forEach((row) => {
      const rowKeys = Object.keys(row)
        .filter((key) => key !== "id")
        .sort();

      expect(rowKeys).toEqual(columnKeys);
    });
  }

  validateRowsExist(data: AberrationEntryData): void {
    expect(Array.isArray(data.rows)).toBeTruthy();

    if (
      data.pagination.total > 0 &&
      data.pagination.page <= data.pagination.totalPages
    ) {
      expect(data.rows.length).toBeGreaterThan(0);
    } else {
      expect(data.rows.length).toBe(0);
    }
  }

  validatePagination(data: AberrationEntryData): void {
    const {
      page,
      limit,
      total,
      totalPages,
    } = data.pagination;

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

    expect(totalPages).toEqual(
      Math.ceil(total / limit),
    );

    if (page < totalPages) {
      expect(data.rows.length).toEqual(limit);
    } else if (page === totalPages) {
      const remainder = total % limit;

      expect(data.rows.length).toEqual(
        remainder === 0
          ? limit
          : remainder,
      );
    }
  }

  validateUniqueRowIds(data: AberrationEntryData): void {
    const ids = data.rows.map((row) => row.id);

    expect(new Set(ids).size).toEqual(ids.length);
  }

  /**
   * Validate request echo.
   *
   * Repository confirms month/year are optional.
   */
  validateQueryEcho(
    data: AberrationEntryData,
    query: AberrationEntryQuery,
  ): void {
    expect(data.pagination.page).toEqual(query.page ?? 1);

    expect(data.pagination.limit).toEqual(query.limit ?? 10);
  }

  validateMonthEcho(
    data: AberrationEntryData,
    query: AberrationEntryQuery,
  ): void {
    if (!query.month) {
      return;
    }

    data.rows.forEach((row) => {
      expect(row.month).toEqual(query.month);
    });
  }

  validateYearEcho(
    data: AberrationEntryData,
    query: AberrationEntryQuery,
  ): void {
    if (!query.year) {
      return;
    }

    const expectedYear = String(query.year);

    data.rows.forEach((row) => {
      expect(row.year).toEqual(expectedYear);
    });
  }

  /**
   * SQL uses COALESCE(...,0)
   * therefore values should never be negative.
   */
  validateNonNegativeAmounts(
    data: AberrationEntryData,
  ): void {
    data.rows.forEach((row) => {
      expect(row.amountBilled).toBeGreaterThanOrEqual(0);

      expect(row.amountRealised).toBeGreaterThanOrEqual(0);
    });
  }

  /**
   * Repository orders by:
   *
   * occurrence_time DESC,
   * created_at DESC
   */
  validateOccurrenceSorting(
    data: AberrationEntryData,
  ): void {
    for (let i = 1; i < data.rows.length; i++) {
      const previous = new Date(
        data.rows[i - 1].occurrenceTime,
      ).getTime();

      const current = new Date(
        data.rows[i].occurrenceTime,
      ).getTime();

      if (
        Number.isNaN(previous) ||
        Number.isNaN(current)
      ) {
        continue;
      }

      expect(previous).toBeGreaterThanOrEqual(current);
    }
  }
}