import type { ZoneWiseAtrEventsQuery } from "../Mapper/zone-wise-atr-events.types";
import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

export const zoneWiseAtrEventsMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

/** Live list month/year with imported rows. */
export const ZONE_WISE_ATR_EVENTS_MONTH = 10;
export const ZONE_WISE_ATR_EVENTS_YEAR = 2025;

export const EXPECTED_ZONE_WISE_ATR_EVENTS_COLUMNS = [
  { key: "ivrsNumber", header: "IVRS No." },
  { key: "eventName", header: "Event Name" },
  { key: "occurrenceTime", header: "Occurrence Time" },
  { key: "remark", header: "Remark" },
  { key: "status", header: "Status" },
  { key: "errorDetails", header: "Error Details" },
  { key: "month", header: "Month" },
  { key: "year", header: "Year" },
] as const;

export const ZONE_WISE_ATR_XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface ZoneWiseAtrEventsTestCase {
  testCaseId: string;
  testName: string;
  tags: string[];
  query: ZoneWiseAtrEventsQuery;
  nonEmptyExpected: boolean;
}

export const zoneWiseAtrEventsListTestCases: ZoneWiseAtrEventsTestCase[] = [
  {
    testCaseId: "IND-REV-ZW-ATR-001",
    testName: `Fetch zone-wise ATR events — month=${ZONE_WISE_ATR_EVENTS_MONTH} year=${ZONE_WISE_ATR_EVENTS_YEAR}`,
    tags: ["@smoke", "@zone-wise-atr-events", "@revenue-protection"],
    query: {
      month: ZONE_WISE_ATR_EVENTS_MONTH,
      year: ZONE_WISE_ATR_EVENTS_YEAR,
      page: 1,
      limit: 20,
    },
    nonEmptyExpected: true,
  },
];
