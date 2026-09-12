import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventDetailQuery as EventDetailApiQuery } from "../Api/eventdetail.api";
import type {
  EventDetailColumn,
  EventDetailResponse,
  EventDetailScenario,
} from "../Mapper/eventdetail.mapper";
import { eventDetailColumnKeys } from "../Mapper/eventdetail.mapper";

export type EventDetailQuery = EventDetailApiQuery & {
  foo?: string;
  unused?: number;
};

export const eventDetailDefaultFromDate = "2025-10-01";
export const eventDetailDefaultToDate = "2025-10-30";
export const eventDetailDefaultPage = 1;
export const eventDetailDefaultLimit = 10;
export const eventDetailMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** Live Oct range has ~11412 pages; must be past that. */
export const eventDetailBeyondPage = 99999;

export const eventDetailExpectedColumns: EventDetailColumn[] = [
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "name", header: "Consumer Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "tariff", header: "Tariff" },
  { key: "msn", header: "MSN" },
  { key: "phase", header: "Phase" },
  { key: "eventClassificationName", header: "EventClassification_Name" },
  { key: "eventName", header: "Event_Name" },
  { key: "eventCount", header: "EventCount" },
  { key: "durationHhMm", header: "Duration" },
];

function primaryQuery(
  overrides: Partial<EventDetailQuery> = {},
): EventDetailQuery {
  return {
    fromDate: eventDetailDefaultFromDate,
    toDate: eventDetailDefaultToDate,
    page: eventDetailDefaultPage,
    limit: eventDetailDefaultLimit,
    ...overrides,
  };
}

/** Live sample: GET /reports/event-detail 1–30 Oct 2025. */
export const eventDetailContractLiveFullResponse: EventDetailResponse = {
  success: true,
  data: {
    columns: [...eventDetailExpectedColumns],
    rows: [
      {
        id: "row-5793-530",
        meterLookupId: 5793,
        division: "CENTRAL",
        zone: "RajMohalla",
        feeder: "AIR(CHQ)",
        dtr: "RZ817",
        name: "KISHANRAO SHANKARRAO",
        address: "12/7 D MOG LINE ..12/7 D MOG LINE ..12/7 D MOG LINE ..",
        ivrsNumber: "N3004015448",
        tariff: "LV1.2",
        msn: "85084432",
        phase: "1 PH",
        eventClassificationName: "Transaction",
        eventId: 530,
        eventName: "Real time clock, date and time",
        eventCount: 27,
        durationHhMm: "NA",
      },
      {
        id: "row-47819-569",
        meterLookupId: 47819,
        division: "EAST",
        zone: "KHAZRANA",
        feeder: "KHAJRANA DARGHA(CHQ)",
        dtr: "IK5710",
        name: "BINAY KUMAR PODDAR",
        address: "B.602 SHUBH LABH HEIGHTS ..B.602 SHUBH LABH HEIGHTS .",
        ivrsNumber: "N3374004426",
        tariff: "LV1.2",
        msn: "18139432",
        phase: "3PH WC",
        eventClassificationName: "Others",
        eventId: 569,
        eventName: "Low PF",
        eventCount: 27,
        durationHhMm: "336:55",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 114119,
      totalPages: 11412,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const eventDetailContractEmptyPageResponse: EventDetailResponse = {
  success: true,
  data: {
    columns: [...eventDetailExpectedColumns],
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

export interface EventDetailTestCase {
  testName: string;
  scenario: EventDetailScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

export function resolveEventDetailQuery(
  scenario: EventDetailScenario,
): EventDetailQuery {
  switch (scenario) {
    case "dev_live_page2":
      return primaryQuery({ page: 2 });
    case "dev_live_page_beyond":
      return primaryQuery({ page: eventDetailBeyondPage });
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

export function resolveEventDetailContractBody(
  scenario: EventDetailScenario,
): EventDetailResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return eventDetailContractLiveFullResponse;
    case "contract_empty_page":
      return eventDetailContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const EventDetailData = {
  fromDate: eventDetailDefaultFromDate,
  toDate: eventDetailDefaultToDate,
  page: eventDetailDefaultPage,
  limit: eventDetailDefaultLimit,
  maxResponseTime: eventDetailMaxResponseTimeMs,
  columnKeys: eventDetailColumnKeys,
};

export const eventDetailTestCases: EventDetailTestCase[] = [
  {
    testName:
      "Event detail — 1–30 Oct 2025 first page shows columns and meter events",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@reports", "@event-detail"],
  },
  {
    testName: "Event detail — page 2 has more unique meter-event rows",
    scenario: "dev_live_page2",
    tags: ["@reports", "@event-detail", "@edge"],
  },
  {
    testName: "Event detail — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@event-detail", "@edge"],
  },
  {
    testName: "Event detail — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@event-detail", "@edge"],
  },
  {
    testName: "Event detail — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@event-detail", "@edge"],
  },
  {
    testName: "Event detail — 1–30 Oct 2025 fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@event-detail", "@edge"],
  },
  {
    testName: "Event detail — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@event-detail", "@edge"],
  },
  {
    testName: "Event detail — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
  {
    testName: "Event detail — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
  {
    testName: "Event detail — invalid toDate is rejected",
    scenario: "invalid_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
  {
    testName: "Event detail — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
  {
    testName: "Event detail — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
  {
    testName: "Event detail — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
  {
    testName: "Event detail — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@event-detail", "@negative"],
  },
];
