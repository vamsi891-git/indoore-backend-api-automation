import { expect } from "@playwright/test";

export interface CommercialPaginatedData {
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: unknown[];
}

export interface CommercialQueryParams {
  month: number;
  year: number;
  page: number;
  pageSize: number;
}

export interface MeterRowKey {
  meterLookupId: number;
  msn: string;
}

/**
 * Ensures no duplicate meter rows on the current page (key: meterLookupId-msn).
 */
export function validateNoDuplicateMeterRows<T extends MeterRowKey>(
  rows: T[],
  reportLabel: string,
): void {
  const seen = new Map<string, T>();

  for (const row of rows) {
    const key = `${row.meterLookupId}-${row.msn}`;

    if (seen.has(key)) {
      console.log(`
======== DUPLICATE ${reportLabel.toUpperCase()} RECORD ========
Key: ${key}
First: ${JSON.stringify(seen.get(key), null, 2)}
Duplicate: ${JSON.stringify(row, null, 2)}
================================================
`);
    }

    expect(seen.has(key), `Duplicate ${reportLabel} record: ${key}`).toBeFalsy();
    seen.set(key, row);
  }
}

export function validateCommercialQueryParams(
  data: CommercialPaginatedData,
  query: CommercialQueryParams,
): void {
  expect(data.month).toBe(query.month);
  expect(data.year).toBe(query.year);
  expect(data.page).toBe(query.page);
  expect(data.pageSize).toBe(query.pageSize);
}

export function validateCommercialPagination(data: CommercialPaginatedData): void {
  expect(data.page).toBeGreaterThan(0);
  expect(data.pageSize).toBeGreaterThan(0);
  expect(data.totalPages).toBeGreaterThan(0);
  expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);

  const expectedTotalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  expect(data.totalPages).toBe(expectedTotalPages);
}

export function validateCommercialTotalCount(data: CommercialPaginatedData): void {
  expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
}
