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
  id?: string;
  dtr?: string;
}

export interface MeterIdentityRow extends MeterRowKey {
  ivrsNumber: string;
}

/** Same consumer can appear as N3008… vs 3008…; uniqueness uses digits after a leading N. */
export function normalizeCommercialIvrs(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^n/i, "");
}

/** Leading zeros on serials are the same meter (00253753 vs 253753). */
export function normalizeCommercialMsn(value: unknown): string {
  const raw = String(value ?? "").trim();
  const stripped = raw.replace(/^0+/, "");
  return stripped || raw.toLowerCase();
}

export function normalizeCommercialDtr(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
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
 * Ensures no duplicate meter rows on the current page
 * (key: meterLookupId-msn-dtr — live grids list the same meter once per DTR).
 */
export function validateNoDuplicateMeterRows<T extends MeterRowKey>(
  rows: T[],
  reportLabel: string,
): void {
  const seen = new Map<string, T>();
  const seenIds = new Map<string, T>();

  for (const row of rows) {
    const key = `${row.meterLookupId}-${normalizeCommercialMsn(row.msn)}-${normalizeCommercialDtr(row.dtr)}`;
    const rowId = String(row.id ?? "").trim();

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

    if (rowId) {
      const idKey = `${rowId}|${normalizeCommercialDtr(row.dtr)}`;
      expect(
        seenIds.has(idKey),
        `Duplicate ${reportLabel} id=${rowId} dtr=${normalizeCommercialDtr(row.dtr) || "(blank)"}`,
      ).toBeFalsy();
      seenIds.set(idKey, row);
    }
  }
}

/**
 * Hard uniqueness on the page for meterLookupId, ivrsNumber, and msn (each field).
 */
export function validateUniqueMeterIdentityFields<T extends MeterIdentityRow>(
  rows: T[],
  reportLabel: string,
): void {
  const byLookup = new Map<number, T>();
  const byIvrs = new Map<string, T>();
  const byMsn = new Map<string, T>();

  for (const row of rows) {
    const lookupId = Number(row.meterLookupId);
    const ivrs = normalizeCommercialIvrs(row.ivrsNumber);
    const msn = String(row.msn ?? "").trim();
    expect(lookupId, `${reportLabel}: meterLookupId must be > 0`).toBeGreaterThan(0);
    expect(msn, `${reportLabel}: msn must be non-blank`).toBeTruthy();
    expect(ivrs, `${reportLabel}: ivrsNumber must be non-blank`).toBeTruthy();
    expect(byLookup.has(lookupId),`Duplicate ${reportLabel} meterLookupId=${lookupId}`,).toBeFalsy();
    expect(byIvrs.has(ivrs),`Duplicate ${reportLabel} ivrsNumber=${ivrs}`,).toBeFalsy();
    expect(byMsn.has(msn),`Duplicate ${reportLabel} msn=${msn}`,).toBeFalsy();
    byLookup.set(lookupId, row);
    byIvrs.set(ivrs, row);
    byMsn.set(msn, row);
  }
}

/** Display-stable key for numeric report values (LF, PF, sanctioned load). */
export function formatCommercialMetricKey(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value ?? "").trim();
}

/**
 * Live grain is meter + DTR. Same meterLookupId / MSN / IVRS on two DTRs is allowed.
 * Same MSN + DTR + metric (or same lookupId + DTR) is a duplicate.
 */
export function validateUniqueMeterIdentityAllowingDistinctMetric<
  T extends MeterIdentityRow,
>(
  rows: T[],
  reportLabel: string,
  metric: (row: T) => string,
): void {
  const byLookupDtr = new Map<string, T>();
  const byIvrsMetric = new Map<string, T>();
  const byMsnMetric = new Map<string, T>();

  for (const row of rows) {
    const lookupId = Number(row.meterLookupId);
    const ivrs = normalizeCommercialIvrs(row.ivrsNumber);
    const msn = normalizeCommercialMsn(row.msn);
    const dtr = normalizeCommercialDtr(row.dtr);
    const metricKey = metric(row);
    expect(lookupId, `${reportLabel}: meterLookupId must be > 0`).toBeGreaterThan(
      0,
    );
    expect(msn, `${reportLabel}: msn must be non-blank`).toBeTruthy();
    expect(ivrs, `${reportLabel}: ivrsNumber must be non-blank`).toBeTruthy();
    const lookupKey = `${lookupId}|${dtr}`;
    expect(
      byLookupDtr.has(lookupKey),
      `Duplicate ${reportLabel} meterLookupId=${lookupId} dtr=${dtr || "(blank)"}`,
    ).toBeFalsy();
    byLookupDtr.set(lookupKey, row);

    const msnKey = `${msn}|${dtr}|${metricKey}`;
    expect(
      byMsnMetric.has(msnKey),
      `Duplicate ${reportLabel} msn=${msn} dtr=${dtr || "(blank)"} with same value=${metricKey}`,
    ).toBeFalsy();
    byMsnMetric.set(msnKey, row);

    const ivrsKey = `${ivrs}|${dtr}|${metricKey}`;
    expect(
      byIvrsMetric.has(ivrsKey),
      `Duplicate ${reportLabel} ivrsNumber=${ivrs} dtr=${dtr || "(blank)"} with same value=${metricKey}`,
    ).toBeFalsy();
    byIvrsMetric.set(ivrsKey, row);
  }
}

export function validateCommercialQueryParams(data: unknown,query: CommercialQueryParams,): void {
  const view = getCommercialPaginatedView(data, query);
  expect(view.month).toBe(query.month);
  expect(view.year).toBe(query.year);
  expect(view.page).toBe(query.page);
  expect(view.pageSize).toBe(query.pageSize);
}
/**
 * How many rows this page must return given pagination.total / limit / page.
 * page 1 limit 10 total 8949 → 10; last page → remainder; beyond last → 0.
 */
export function expectedCommercialPageRecordCount(totalCount: number,page: number,pageSize: number,): number {
  if (totalCount <= 0 || pageSize <= 0 || page <= 0) {
    return 0;
  }
  const offset = (page - 1) * pageSize;
  return Math.min(pageSize, Math.max(0, totalCount - offset));
}
export function validateCommercialPagination(data: unknown,query: CommercialQueryParams,): void {
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
  const expectedTotalPages = Math.max(1,Math.ceil(view.totalCount / view.pageSize),);
  expect(view.totalPages).toBe(expectedTotalPages);
  // Page records must match total math (not only rows.length <= limit).
  const expectedRecords = expectedCommercialPageRecordCount(view.totalCount,view.page,view.pageSize,);
  expect(view.rows.length,`page records (${view.rows.length}) must equal expected from total=${view.totalCount} page=${view.page} limit=${view.pageSize} → ${expectedRecords}`,).toBe(expectedRecords);
}
/**
 * Hard check: data.rows.length === f(pagination.total, page, limit).
 * When limit >= total on page 1, this is rows.length === total.
 */
export function validateCommercialTotalCount(data: unknown,query: CommercialQueryParams,): void {
  const view = getCommercialPaginatedView(data, query);
  const expectedRecords = expectedCommercialPageRecordCount(view.totalCount,view.page,view.pageSize,);
  expect(view.rows.length,`records (${view.rows.length}) must equal expected page size from total (${expectedRecords}); total=${view.totalCount}`,).toBe(expectedRecords);
  expect(view.totalCount).toBeGreaterThanOrEqual(view.rows.length);
}
/** Console table for PF / commercial grid pagination counts. */
export function logCommercialPageCounts(options: {
  label: string;
  connectionCategory?: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  records: number;
  expectedRecords: number;
}): void {
  const {
    label,
    connectionCategory,
    page,
    pageSize,
    total,
    totalPages,
    records,
    expectedRecords,
  } = options;
  const match = records === expectedRecords ? "MATCH" : "MISMATCH";
  console.log(`
======== ${label.toUpperCase()} — PAGINATION COUNTS ========
connectionCategory : ${connectionCategory ?? "(all)"}
page / pageSize    : ${page} / ${pageSize}
pagination.total   : ${total}
pagination.totalPages : ${totalPages}
page records       : ${records}
expected records   : ${expectedRecords}
records vs total   : ${match}
========================================================
`);
}

export function logCommercialCategorySplit(options: {
  allTotal: number;
  domesticTotal: number;
  nonDomesticTotal: number;
}): void {
  const { allTotal, domesticTotal, nonDomesticTotal } = options;
  const sum = domesticTotal + nonDomesticTotal;
  const uncategorized = allTotal - sum;
  console.log(`
======== CONNECTION CATEGORY SPLIT ========
unfiltered total     : ${allTotal}
domestic total       : ${domesticTotal}
non-domestic total   : ${nonDomesticTotal}
domestic + non-dom   : ${sum}
uncategorized (gap)  : ${uncategorized}
partition check      : ${sum <= allTotal ? "PASS (sum ≤ all)" : "FAIL"}
==============================================
`);
}
