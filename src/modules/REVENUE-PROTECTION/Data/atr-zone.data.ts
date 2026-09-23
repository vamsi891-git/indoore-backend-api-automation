import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { AtrZoneQuery } from "../Mapper/atr-zone.mapper";

export const atrZoneMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

/**
 * Baseline query mirrors the live sample:
 * GET /indore/revenue-protection/atr-zone?year=2025&reportType=aberrations_details&page=1&limit=10
 */
export const atrZoneDefaultQuery: AtrZoneQuery = {
  year: 2025,
  reportType: "aberrations_details",
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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const atrZoneTestCases: AtrZoneTestCase[] = [
  {
    testCaseId: "IND-RPT-ATZ-001",
    testName:
      "IND-RPT-ATZ-001 — Validate GET /indore/revenue-protection/atr-zone — aberrations_details (2025)",
    query: { ...atrZoneDefaultQuery },
    tags: ["@smoke", "@revenue-protection", "@atr-zone"],
    nonEmptyExpected: true,
  },
  {
    testCaseId: "IND-RPT-ATZ-002",
    testName: "IND-RPT-ATZ-002 — Validate pagination — smaller page size (limit 5)",
    query: { ...atrZoneSmallPageQuery },
    tags: ["@revenue-protection", "@atr-zone"],
    nonEmptyExpected: false,
  },
  {
    testCaseId: "IND-RPT-ATZ-003",
    testName: "IND-RPT-ATZ-003 — Validate pagination — page 2 (limit 5)",
    query: { ...atrZoneSecondPageQuery },
    tags: ["@revenue-protection", "@atr-zone"],
    nonEmptyExpected: false,
  },
];

/** Column keys from live aberrations_details response. */
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
  "enteredByName",
  "entryDateTime",
] as const;

/** Display headers from live response — fail if renamed. */
export const EXPECTED_ATRZONE_COLUMN_HEADERS: Record<
  (typeof EXPECTED_ATRZONE_COLUMN_KEYS)[number],
  string
> = {
  year: "Year",
  month: "Month",
  circle: "Circle",
  division: "Division",
  zone: "Zone",
  feeder: "Feeder",
  dtr: "DTR",
  feeder1: "Feeder Name New",
  dtr1: "DTR Code New",
  ivrs: "IVRS No.",
  meterSerialNumber: "Meter Serial No.",
  eventName: "Event Name",
  eventCategory: "Event Category",
  occurrenceTime: "Occurrence Time",
  restorationTime: "Restoration Time",
  remarks: "Remarks",
  amountBilled: "Amt Billed",
  amountRealised: "Amt Realised",
  fieldRemarks: "Field Remarks",
  p4Number: "P4 No.",
  p4Date: "P4 Date",
  enteredByName: "Entered By",
  entryDateTime: "Entry Date",
};

/** Soft DQ allowlist — unknown eventName only logs, does not fail the suite. */
export const CANONICAL_ATRZONE_EVENTS = [
  "Suspected Case",
  "Disconnected",
  "Meter Not Communicate",
  "MD Greater Than SL",
  "Zero Consumption",
  "Meter Seal",
  "Meter tech",
  "Current bypass",
  "Meter stolen",
] as const;
