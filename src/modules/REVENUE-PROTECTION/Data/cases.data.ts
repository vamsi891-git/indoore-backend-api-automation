import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CasesQuery } from "../Mapper/cases.mapper";

export const casesMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

/**
 * Baseline query mirrors the live sample:
 * GET /indore/revenue-protection/aberrations/detail?month=JAN&year=2026&page=1&limit=10
 */
export const casesDefaultQuery: CasesQuery = {
  month: "JAN",
  year: 2026,
  page: 1,
  limit: 10,
};

export const casesSmallPageQuery: CasesQuery = {
  ...casesDefaultQuery,
  page: 1,
  limit: 5,
};

export const casesSecondPageQuery: CasesQuery = {
  ...casesDefaultQuery,
  page: 2,
  limit: 5,
};

/** Far-future month/year unlikely to have rows — empty-success probe. */
export const casesZeroRowsQuery: CasesQuery = {
  ...casesDefaultQuery,
  month: "DEC",
  year: 2099,
};

export interface CasesTestCase {
  testCaseId: string;
  testName: string;
  query: CasesQuery;
  tags: string[];
}

export const casesTestCases: CasesTestCase[] = [
  {
    testCaseId: "IND-RPT-001",
    testName:
      "IND-RPT-001 — Validate GET /indore/revenue-protection/aberrations/detail — default page (JAN 2026)",
    query: { ...casesDefaultQuery },
    tags: ["@smoke", "@revenue-protection", "@cases", "@aberrations-detail"],
  },
  {
    testCaseId: "IND-RPT-002",
    testName: "IND-RPT-002 — Validate pagination — smaller page size (limit 5)",
    query: { ...casesSmallPageQuery },
    tags: ["@revenue-protection", "@cases", "@aberrations-detail"],
  },
  {
    testCaseId: "IND-RPT-003",
    testName: "IND-RPT-003 — Validate pagination — page 2 (limit 5)",
    query: { ...casesSecondPageQuery },
    tags: ["@revenue-protection", "@cases", "@aberrations-detail"],
  },
];

/** Column keys from production sample (id is row-only, not in columns metadata). */
export const EXPECTED_CASE_COLUMN_KEYS = [
  "circle",
  "division",
  "zone",
  "year",
  "month",
  "consumerName",
  "address",
  "msn",
  "category",
  "phase",
  "ivrsNo",
  "remarks",
  "event",
  "amountBilled",
  "amountRealisation",
  "p4Number",
  "p4Date",
  "entryDateTime",
  "status",
] as const;

/**
 * Canonical event labels for soft DQ checks.
 * Typos / casing drift (e.g. "meetr seal") are flagged, not hard-failed.
 */
export const CANONICAL_CASE_EVENTS = [
  "MD Greater Than SL",
  "Zero Consumption",
  "Meter Seal",
  "Meter tech",
  "Current bypass",
  "Meter stolen",
] as const;
