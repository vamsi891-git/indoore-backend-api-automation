import type { AberrationEntryQuery } from "../Mapper/aberration-entry.mapper";

export const aberrationEntryDefaultQuery: AberrationEntryQuery = {
  entryType: "zone",
  month: "January",
  year: 2026,
  page: 1,
  limit: 10,
};

export const aberrationEntryMaxResponseTimeMs = 90_000;

export const EXPECTED_ABERRATION_ENTRY_COLUMN_KEYS = [
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "name",
  "address",
  "ivrsNo",
  "meterSerialNo",
  "eventName",
  "occurrenceTime",
  "restorationTime",
  "remarks",
  "amountBilled",
  "amountRealised",
  "fieldOfficerRemarks",
  "fieldOfficerName",
  "fieldOfficerDesignation",
  "mrTransactionNo",
  "p4No",
  "p4Date",
  "inspectionDate",
  "entryDate",
  "month",
  "year",
] as const;

/**
 * Canonical event labels for soft DQ checks (includes live typo variants).
 */
export const CANONICAL_ABERRATION_EVENTS = [
  "MD Greater Than SL",
  "Zero Consumption",
  "Meter Seal",
  "Meter tech",
  "Current bypass",
  "Meter stolen",
  "meetr seal",
  "current bypass",
] as const;

export const aberrationEntryTestCases = [
  {
    testCaseId: "IND-REV-ABE-ENTRY-001",

    testName:
      "IND-REV-ABE-ENTRY-001 — Fetch Aberration Entry using month + year",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@positive",
    ],

    query: {
      entryType: "zone",
      month: "January",
      year: 2026,
      page: 1,
      limit: 10,
    },
  },

  {
    testCaseId: "IND-REV-ABE-ENTRY-002",

    testName:
      "IND-REV-ABE-ENTRY-002 — Fetch Aberration Entry using only year",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@positive",
    ],

    query: {
      entryType: "zone",
      year: 2026,
      page: 1,
      limit: 10,
    },
  },

  {
    testCaseId: "IND-REV-ABE-ENTRY-003",

    testName:
      "IND-REV-ABE-ENTRY-003 — Fetch Aberration Entry using only month",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@positive",
    ],

    query: {
      entryType: "zone",
      month: "January",
      page: 1,
      limit: 10,
    },
  },

  {
    testCaseId: "IND-REV-ABE-ENTRY-004",

    testName:
      "IND-REV-ABE-ENTRY-004 — Fetch Aberration Entry without optional filters",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@positive",
    ],

    query: {
      entryType: "zone",
      page: 1,
      limit: 10,
    },
  },
] as const;