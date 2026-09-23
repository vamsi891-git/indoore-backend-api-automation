import type { AberrationEntryQuery } from "../Mapper/aberration-entry.mapper";

/** Live baseline: GET .../aberration-entry/zone?month=OCT&year=2025&page=1&limit=10 */
export const aberrationEntryDefaultQuery: AberrationEntryQuery = {
  entryType: "zone",
  month: "OCT",
  year: 2025,
  page: 1,
  limit: 10,
};

/** Live baseline: GET .../aberration-entry/cvo?month=oct&year=2025&page=1&limit=20 */
export const aberrationEntryCvoDefaultQuery: AberrationEntryQuery = {
  entryType: "cvo",
  month: "oct",
  year: 2025,
  page: 1,
  limit: 20,
};

/** Live baseline: GET .../aberration-entry/eenltmt?month=10&year=2025&page=1&limit=10 */
export const aberrationEntryEenltmtDefaultQuery: AberrationEntryQuery = {
  entryType: "eenltmt",
  month: 10,
  year: 2025,
  page: 1,
  limit: 10,
};

/** UI-style October 2025 baselines used by actionStatus / event / network consistency. */
export const aberrationEntryZoneOctoberQuery: AberrationEntryQuery = {
  entryType: "zone",
  month: "October",
  year: 2025,
  page: 1,
  limit: 10,
};

export const aberrationEntryCvoOctoberQuery: AberrationEntryQuery = {
  entryType: "cvo",
  month: "October",
  year: 2025,
  page: 1,
  limit: 10,
};

export const aberrationEntryEenltmtOctoberQuery: AberrationEntryQuery = {
  entryType: "eenltmt",
  month: "October",
  year: 2025,
  page: 1,
  limit: 10,
};

export const ABERRATION_ENTRY_ACTION_STATUSES = ["COMPLETED", "PENDING"] as const;

export const ABERRATION_ENTRY_CONSISTENCY_BASELINES = [
  {
    label: "zone",
    tag: "@aberration-entry-zone",
    networkTag: "@aberration-entry-zone-network",
    query: aberrationEntryZoneOctoberQuery,
  },
  {
    label: "cvo",
    tag: "@aberration-entry-cvo",
    networkTag: "@aberration-entry-cvo-network",
    query: aberrationEntryCvoOctoberQuery,
  },
  {
    label: "eenltmt",
    tag: "@aberration-entry-eenltmt",
    networkTag: "@aberration-entry-eenltmt-network",
    query: aberrationEntryEenltmtOctoberQuery,
  },
] as const;

export const aberrationEntryMaxResponseTimeMs = 90_000;

export const EXPECTED_ABERRATION_ENTRY_COLUMN_KEYS = [
  "year",
  "month",
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
  "sourceRemarks",
  "amountBilled",
  "amountRealised",
  "fieldOfficerRemarks",
  "mrTransactionNo",
  "p4No",
  "p4Date",
  "inspectionDate",
  "actionStatus",
  "enteredByName",
  "entryDate",
  "updatedOn",
] as const;

/**
 * Event Name dropdown values (UI screenshots) — exclude "All Events".
 * Used for filter-sum consistency: sum(event totals) === baseline total.
 */
export const ABERRATION_ENTRY_EVENT_NAMES = [
  "Aberration",
  "Abnormal Low Consumption",
  "Critical Suspected Techno Comm",
  "Current Bypass",
  "Current Bypass And Current Unbalance",
  "Current Unbalance",
  "Current Without Voltage",
  "Current Zero In Any Phase",
  "Disconnected",
  "Earth Loading",
  "Low Pf",
  "Low Voltage In Phase",
  "Magnet",
  "MD Greater Than SL",
  "Meter Cover Open",
  "Meter Never Communicate",
  "Meter Not Communicate",
  "Neutral Current > Zero And Phase Current Zero",
  "Neutral Disturbance",
  "Night Cons Less Than Ten Percent Of Day Cons",
  "Night Zero Consumption",
  "Over Voltage In Any Phase",
  "Phase Current And Neutral Current Mismatch",
  "Phase Current > Zero And Neutral Current Zero",
  "Phase Voltage Missing",
  "Power Failure",
  "Real Time Clock Problem",
  "Single Wire Operation",
  "Suspected Case",
  "Suspected Cases",
  "Under Utilization",
  "Voltage Unbalance",
  // Seen in live OCT 2025 rows
  "Zero Consumption",
  "R Phase Current Bypass",
  "R And Y Phase Current Bypass",
  "R Phase Current Zero",
  "B Phase Current Zero",
] as const;

/** Soft DQ alias — same as UI event list. */
export const CANONICAL_ABERRATION_EVENTS = ABERRATION_ENTRY_EVENT_NAMES;

export const aberrationEntryTestCases = [
  {
    testCaseId: "IND-REV-ABE-ENTRY-001",
    testName: "IND-REV-ABE-ENTRY-001 — Fetch Aberration Entry zone OCT 2025 (default page)",
    tags: ["@smoke", "@revenue-protection", "@aberration-entry", "@positive"],
    nonEmptyExpected: true,
    query: { ...aberrationEntryDefaultQuery },
  },
  {
    testCaseId: "IND-REV-ABE-ENTRY-002",
    testName: "IND-REV-ABE-ENTRY-002 — Pagination smaller page size (limit 5)",
    tags: ["@revenue-protection", "@aberration-entry", "@positive"],
    nonEmptyExpected: false,
    query: { ...aberrationEntryDefaultQuery, limit: 5 },
  },
  {
    testCaseId: "IND-REV-ABE-ENTRY-CVO-001",
    testName: "IND-REV-ABE-ENTRY-CVO-001 — Fetch Aberration Entry CVO oct 2025 (default page)",
    tags: [
      "@smoke",
      "@revenue-protection",
      "@aberration-entry",
      "@aberration-entry-cvo",
      "@positive",
    ],
    nonEmptyExpected: true,
    query: { ...aberrationEntryCvoDefaultQuery },
  },
  {
    testCaseId: "IND-REV-ABE-ENTRY-CVO-002",
    testName: "IND-REV-ABE-ENTRY-CVO-002 — CVO pagination smaller page size (limit 5)",
    tags: ["@revenue-protection", "@aberration-entry", "@aberration-entry-cvo", "@positive"],
    nonEmptyExpected: false,
    query: { ...aberrationEntryCvoDefaultQuery, limit: 5 },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-001",
    testName: "IND-REV-ABE-EEN-001 — Fetch Aberration Entry EENLTMT month=10 year=2025",
    tags: [
      "@smoke",
      "@revenue-protection",
      "@aberration-entry",
      "@aberration-entry-eenltmt",
      "@positive",
    ],
    nonEmptyExpected: true,
    query: { ...aberrationEntryEenltmtDefaultQuery },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-002",
    testName: "IND-REV-ABE-EEN-002 — EENLTMT pagination smaller page size (limit 5)",
    tags: ["@revenue-protection", "@aberration-entry", "@aberration-entry-eenltmt", "@positive"],
    nonEmptyExpected: false,
    query: { ...aberrationEntryEenltmtDefaultQuery, limit: 5 },
  },
] as const;
