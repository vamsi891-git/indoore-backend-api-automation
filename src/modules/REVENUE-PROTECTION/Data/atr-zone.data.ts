import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { AtrZoneQuery } from "../Mapper/atr-zone.mapper";

export const atrZoneMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

/**
 * Baseline query mirrors the live sample:
 * GET /indore/revenue-protection/atr-zone?year=2026&page=1&limit=10
 *
 * NOTE: unlike Cases, this endpoint takes NO month param — rows span
 * multiple months within the requested year. Confirmed from the sample
 * response (rows contain both APR and MAR for year=2026).
 */
export const atrZoneDefaultQuery: AtrZoneQuery = {
  year: 2026,
  page: 1,
  limit: 10,
};

export const atrZoneSmallPageQuery: AtrZoneQuery = {
  ...atrZoneDefaultQuery,
  page: 1,
  limit: 5,
};

export const atrZoneSecondPageQuery: AtrZoneQuery = {
  ...atrZoneDefaultQuery,
  page: 2,
  limit: 5,
};

/** Far-future year unlikely to have rows — empty-success probe. */
export const atrZoneZeroRowsQuery: AtrZoneQuery = {
  ...atrZoneDefaultQuery,
  year: 2099,
};

export interface AtrZoneTestCase {
  testCaseId: string;
  testName: string;
  query: AtrZoneQuery;
  tags: string[];
}

export const atrZoneTestCases: AtrZoneTestCase[] = [
  {
    testCaseId: "IND-RPT-ATZ-001",
    testName:
      "IND-RPT-ATZ-001 — Validate GET /indore/revenue-protection/atr-zone — default page (2026)",
    query: { ...atrZoneDefaultQuery },
    tags: ["@smoke", "@revenue-protection", "@atr-zone"],
  },
  {
    testCaseId: "IND-RPT-ATZ-002",
    testName: "IND-RPT-ATZ-002 — Validate pagination — smaller page size (limit 5)",
    query: { ...atrZoneSmallPageQuery },
    tags: ["@revenue-protection", "@atr-zone"],
  },
  {
    testCaseId: "IND-RPT-ATZ-003",
    testName: "IND-RPT-ATZ-003 — Validate pagination — page 2 (limit 5)",
    query: { ...atrZoneSecondPageQuery },
    tags: ["@revenue-protection", "@atr-zone"],
  },
];

/**
 * Column keys from production sample (id excluded — it is NOT part of the
 * DB select list in fetchAtrZoneRows; see AtrZoneRowDb in the repository.
 * It appears to be generated above the repository layer).
 */
export const EXPECTED_ATRZONE_COLUMN_KEYS = [
  "year",
  "month",
  "circle",
  "division",
  "zone",
  "feeder",
  "dtr",
  "feeder1",
  "dtr1",
  "ivrs",
  "meterSerialNumber",
  "eventName",
  "eventCategory",
  "occurrenceTime",
  "restorationTime",
  "remarks",
  "amountBilled",
  "amountRealised",
  "fieldRemarks",
  "p4Number",
  "p4Date",
  "entryDateTime",
] as const;

/**
 * Reuses the SAME canonical event list as Cases — confirmed same
 * ac.event_name column, same "meetr seal" typo present in this endpoint's
 * sample data (row id 8). Do not fork a separate list; if these diverge
 * later, that itself is worth flagging to the backend team.
 */
export { CANONICAL_CASE_EVENTS as CANONICAL_ATRZONE_EVENTS } from "./cases.data";