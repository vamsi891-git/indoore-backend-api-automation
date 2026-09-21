import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventReportQuery } from "../Api/eventreport.api";
import type {
  EventReportResponse,
  EventReportScenario,
} from "../Mapper/eventreport.mapper";
import { eventReportColumnKeys } from "../Mapper/eventreport.mapper";

export const eventReportMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary window — 1 Oct 2025. */
export const eventReportDefaultFromDate = "2025-10-01";
export const eventReportDefaultToDate = "2025-10-01";
export const eventReportDefaultPage = 1;
export const eventReportDefaultLimit = 10;
export const eventReportBeyondPage = 9999;

/** Live column grid (slNo and eventId are on rows only). */
export const eventReportExpectedColumns = [
  { key: "circle", header: "Circle" },
  { key: "eventName", header: "Event Name" },
  { key: "meterCount", header: "Meter Count" },
  { key: "eventCount", header: "Event Count" },
  { key: "durationHhMm", header: "Duration (HH:MM)" },
] as const;

function primaryQuery(
  overrides: Partial<EventReportQuery> = {},
): EventReportQuery {
  return {
    fromDate: eventReportDefaultFromDate,
    toDate: eventReportDefaultToDate,
    page: eventReportDefaultPage,
    limit: eventReportDefaultLimit,
    ...overrides,
  };
}

/** Live sample from GET /indore/reports/event-report (1 Oct 2025). */
export const eventReportContractLiveFullResponse: EventReportResponse = {
  success: true,
  data: {
    columns: [...eventReportExpectedColumns],
    rows: [
      {
        id: "row-1-528-Earth_loading",
        slNo: 1,
        circle: "ALL",
        eventId: 528,
        eventName: "Earth loading",
        meterCount: 2287,
        eventCount: 10344,
        durationHhMm: "42946:11",
      },
      {
        id: "row-2-529-Power_failure",
        slNo: 2,
        circle: "ALL",
        eventId: 529,
        eventName: "Power failure",
        meterCount: 13809,
        eventCount: 19632,
        durationHhMm: "11250:58",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 19,
      totalPages: 2,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const eventReportContractEmptyPageResponse: EventReportResponse = {
  success: true,
  data: {
    columns: [...eventReportExpectedColumns],
    rows: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      totalIsExact: true,
      hasMore: false,
    },
  },
};

export interface EventReportTestCase {
  testName: string;
  scenario: EventReportScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveEventReportQuery(
  scenario: EventReportScenario,
): EventReportQuery {
  switch (scenario) {
    case "dev_live_page2":
      return primaryQuery({ page: 2 });
    case "dev_live_page_beyond":
      return primaryQuery({ page: eventReportBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_date_range":
      return primaryQuery({
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "invalid_date_format":
      return primaryQuery({ fromDate: "not-a-date" });
    case "invalid_to_date":
      return primaryQuery({ toDate: "not-a-date" });
    case "missing_from_date":
      return primaryQuery({ fromDate: undefined });
    case "missing_to_date":
      return primaryQuery({ toDate: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "dev_live_primary":
    case "contract_live_full":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveEventReportContractBody(
  scenario: EventReportScenario,
): EventReportResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return eventReportContractLiveFullResponse;
    case "contract_empty_page":
      return eventReportContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const EventReportData = {
  fromDate: eventReportDefaultFromDate,
  toDate: eventReportDefaultToDate,
  page: eventReportDefaultPage,
  limit: eventReportDefaultLimit,
  maxResponseTime: eventReportMaxResponseTimeMs,
  columnKeys: eventReportColumnKeys,
};

export const eventReportTestCases: EventReportTestCase[] = [
  {
    testName:
      "Event report — 1 Oct 2025 first page shows columns and event totals",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@reports", "@event-report"],
    nonEmptyExpected: true,
  },
  {
    testName: "Event report — page 2 continues serial numbers without duplicates",
    scenario: "dev_live_page2",
    tags: ["@reports", "@event-report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@event-report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@event-report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@event-report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — 1 Oct 2025 fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@event-report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@event-report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — invalid toDate is rejected",
    scenario: "invalid_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event report — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@event-report", "@negative"],
    nonEmptyExpected: false,
  },
];
