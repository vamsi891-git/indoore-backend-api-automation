import type { ConsumerValidationQuery } from "../Mapper/consumer-validation.mapper";

export const consumerValidationPath = "/indore/data-validation/consumer-validation";

/** Live window used by consumer-validation list (invalid-rows CTE). */
export const consumerValidationDefaultFromDate = "2025-10-01";
export const consumerValidationDefaultToDate = "2025-10-30";

export const consumerValidationMaxResponseTimeMs = 60_000;

export function consumerValidationQueryString(query: ConsumerValidationQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.fromDate?.trim()) params.set("fromDate", query.fromDate.trim());
  if (query.toDate?.trim()) params.set("toDate", query.toDate.trim());
  return params.toString();
}

/** GET /indore/data-validation/consumer-validation column contract. */
export const EXPECTED_CONSUMER_VALIDATION_COLUMNS = [
  { key: "consumerId", header: "Consumer ID" },
  { key: "consumerName", header: "Consumer Name" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "accountId", header: "Account ID" },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "meterPhase", header: "Meter Phase" },
  { key: "category", header: "Category" },
  { key: "validationName", header: "Validation Name" },
  { key: "validationRule", header: "Validation Rule" },
  { key: "validationStatus", header: "Validation Status" },
  { key: "validationDate", header: "Validation Date" },
] as const;

export const consumerValidationDefaultQuery: ConsumerValidationQuery = {
  page: 1,
  limit: 20,
  fromDate: consumerValidationDefaultFromDate,
  toDate: consumerValidationDefaultToDate,
};

export const consumerValidationExportPath = "/indore/data-validation/consumer-validation/export";

/** Backend caps export rows (live file reports Total records: 50000). */
export const consumerValidationExportMaxResponseTimeMs = 180_000;

export interface ConsumerValidationExportQuery {
  fromDate?: string;
  toDate?: string;
}

export function consumerValidationExportQueryString(query: ConsumerValidationExportQuery): string {
  const params = new URLSearchParams();
  if (query.fromDate?.trim()) params.set("fromDate", query.fromDate.trim());
  if (query.toDate?.trim()) params.set("toDate", query.toDate.trim());
  return params.toString();
}

export const consumerValidationExportDefaultQuery: ConsumerValidationExportQuery = {
  fromDate: consumerValidationDefaultFromDate,
  toDate: consumerValidationDefaultToDate,
};

/**
 * Export workbook layout (1-indexed):
 * 1 title, 2 date range, 3 generated-at, 4 total records, 5 blank, 6 column headers, 7+ data.
 */
export const CONSUMER_VALIDATION_EXPORT_HEADER_ROW = 6;
export const CONSUMER_VALIDATION_EXPORT_DATA_START_ROW = 7;

export interface ConsumerValidationTestCase {
  testName: string;
  query: ConsumerValidationQuery;
  expectedStatus: 200 | 400;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
  expectEmptyRows?: boolean;
}

export const consumerValidationTestCases: ConsumerValidationTestCase[] = [
  {
    testName: "GET /data-validation/consumer-validation — default page",
    query: { ...consumerValidationDefaultQuery },
    expectedStatus: 200,
    tags: ["@smoke", "@data-validation", "@consumer-validation"],
    nonEmptyExpected: true,
  },
  {
    testName: "GET /data-validation/consumer-validation — page 2",
    query: { ...consumerValidationDefaultQuery, page: 2 },
    expectedStatus: 200,
    tags: ["@data-validation", "@consumer-validation", "@edge"],
  },
  {
    testName: "GET /data-validation/consumer-validation — limit 1",
    query: { ...consumerValidationDefaultQuery, limit: 1 },
    expectedStatus: 200,
    tags: ["@data-validation", "@consumer-validation", "@edge"],
  },
  {
    testName: "GET /data-validation/consumer-validation — page beyond total",
    query: { ...consumerValidationDefaultQuery, page: 999_999 },
    expectedStatus: 200,
    tags: ["@data-validation", "@consumer-validation", "@edge"],
    expectEmptyRows: true,
  },
  {
    testName: "GET /data-validation/consumer-validation — page=0 rejected",
    query: { ...consumerValidationDefaultQuery, page: 0 },
    expectedStatus: 400,
    tags: ["@data-validation", "@consumer-validation", "@negative"],
  },
  {
    testName: "GET /data-validation/consumer-validation — limit=0 rejected",
    query: { ...consumerValidationDefaultQuery, limit: 0 },
    expectedStatus: 400,
    tags: ["@data-validation", "@consumer-validation", "@negative"],
  },
];
