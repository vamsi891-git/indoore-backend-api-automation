import { expect } from "@playwright/test";

export interface CommercialGridPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CommercialGridData<TRow = unknown> {
  columns?: Array<{ key: string; header: string }>;
  rows: TRow[];
  pagination: CommercialGridPagination;
}

export interface CommercialPaginatedData {
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: unknown[];
  reportName?: string;
  description?: string;
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

/** Live commercial reports return `{ columns, rows, pagination }` without query echo. */
export function isCommercialGridData(data: unknown): data is CommercialGridData {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    Array.isArray(record.rows) &&
    typeof record.pagination === "object" &&
    record.pagination !== null
  );
}

/** Normalizes grid or legacy flat commercial report payloads for validators. */
export function getCommercialPaginatedView(
  data: unknown,
  query: CommercialQueryParams,
): CommercialPaginatedData {
  if (isCommercialGridData(data)) {
    const { pagination, rows } = data;
    return {
      month: query.month,
      year: query.year,
      page: pagination.page,
      pageSize: pagination.limit,
      totalCount: pagination.total,
      totalPages: pagination.totalPages,
      rows,
    };
  }

  const flat = data as Partial<CommercialPaginatedData>;
  return {
    month: flat.month ?? query.month,
    year: flat.year ?? query.year,
    page: flat.page ?? query.page,
    pageSize: flat.pageSize ?? query.pageSize,
    totalCount: flat.totalCount ?? 0,
    totalPages: flat.totalPages ?? 0,
    rows: flat.rows ?? [],
    reportName: flat.reportName,
    description: flat.description,
  };
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
  data: unknown,
  query: CommercialQueryParams,
): void {
  const view = getCommercialPaginatedView(data, query);
  expect(view.month).toBe(query.month);
  expect(view.year).toBe(query.year);
  expect(view.page).toBe(query.page);
  expect(view.pageSize).toBe(query.pageSize);
}

export function validateCommercialPagination(
  data: unknown,
  query: CommercialQueryParams,
): void {
  const view = getCommercialPaginatedView(data, query);
  expect(view.page).toBeGreaterThan(0);
  expect(view.pageSize).toBeGreaterThan(0);
  expect(view.rows.length).toBeLessThanOrEqual(view.pageSize);

  if (view.totalCount === 0) {
    expect(view.totalPages).toBe(0);
    expect(view.rows.length).toBe(0);
    return;
  }

  expect(view.totalPages).toBeGreaterThan(0);
  const expectedTotalPages = Math.max(
    1,
    Math.ceil(view.totalCount / view.pageSize),
  );
  expect(view.totalPages).toBe(expectedTotalPages);
}

export function validateCommercialTotalCount(
  data: unknown,
  query: CommercialQueryParams,
): void {
  const view = getCommercialPaginatedView(data, query);
  expect(view.totalCount).toBeGreaterThanOrEqual(view.rows.length);
}
