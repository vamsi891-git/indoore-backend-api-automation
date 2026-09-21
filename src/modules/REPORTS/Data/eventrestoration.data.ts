import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventRestorationQuery as EventRestorationApiQuery } from "../Api/eventrestoration.api";
import type {
  EventRestorationColumn,
  EventRestorationResponse,
  EventRestorationScenario,
} from "../Mapper/eventrestoration.mapper";
import { eventRestorationColumnKeys } from "../Mapper/eventrestoration.mapper";

export type EventRestorationQuery = EventRestorationApiQuery & {
  foo?: string;
  unused?: number;
};

export const eventRestorationMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const eventRestorationDefaultFromDate = "2025-10-01";
export const eventRestorationDefaultToDate = "2025-10-30";
export const eventRestorationDefaultPage = 1;
export const eventRestorationDefaultLimit = 10;
/** Live Oct range has ~5835 pages. */
export const eventRestorationBeyondPage = 99999;

export const eventRestorationExpectedColumns: EventRestorationColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "name", header: "Consumer Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "tariff", header: "Tariff" },
  { key: "msn", header: "MSN" },
  { key: "phase", header: "Phase" },
  { key: "eventClassificationName", header: "Event Classification" },
  { key: "eventName", header: "Event Name" },
  { key: "occurrenceTime", header: "Occurrence Time" },
];

function primaryQuery(
  overrides: Partial<EventRestorationQuery> = {},
): EventRestorationQuery {
  return {
    fromDate: eventRestorationDefaultFromDate,
    toDate: eventRestorationDefaultToDate,
    page: eventRestorationDefaultPage,
    limit: eventRestorationDefaultLimit,
    ...overrides,
  };
}

export const eventRestorationContractLiveFullResponse: EventRestorationResponse =
  {
    success: true,
    data: {
      columns: [...eventRestorationExpectedColumns],
      rows: [
        {
          id: "row-1-19258966",
          slNo: 1,
          circle: "Indore city circle",
          division: "WEST",
          zone: "GPH",
          subStation: "Citi Control Room",
          feeder: "RAJWADA(CHQ)",
          dtr: "WI583",
          name: "SH DAYAL S/O SARDARSINGH",
          address: "..10  DILIPSINGH COLONEY ...",
          ivrsNumber: "N3477023296",
          tariff: "LV1.2",
          msn: "19258966",
          phase: "3PH WC",
          eventClassificationName: "Transaction",
          eventName: "Real time clock, date and time",
          occurrenceTime: "31-10-2025 05:29",
        },
        {
          id: "row-2-93026985",
          slNo: 2,
          circle: "Indore city circle",
          division: "WEST",
          zone: "Subhash Chowk",
          subStation: "Citi Control Room",
          feeder: "SHIV VILLAS PALA.(CHQ)",
          dtr: "IW112",
          name: "MOHAMMED NOSHAD ABDULGANI",
          address: "28/2 CHHIPA BAKHAL 28/2 CHHIPA BAKHAL INDORE",
          ivrsNumber: "N3472020015",
          tariff: "LV1.2",
          msn: "93026985",
          phase: "1 PH",
          eventClassificationName: "Transaction",
          eventName: "Real time clock, date and time",
          occurrenceTime: "31-10-2025 05:29",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 58342,
        totalPages: 5835,
        totalIsExact: true,
        hasMore: true,
      },
    },
  };

export const eventRestorationContractEmptyPageResponse: EventRestorationResponse =
  {
    success: true,
    data: {
      columns: [...eventRestorationExpectedColumns],
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

export interface EventRestorationTestCase {
  testName: string;
  scenario: EventRestorationScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveEventRestorationQuery(
  scenario: EventRestorationScenario,
): EventRestorationQuery {
  switch (scenario) {
    case "dev_live_page2":
      return primaryQuery({ page: 2 });
    case "dev_live_page_beyond":
      return primaryQuery({ page: eventRestorationBeyondPage });
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

export function resolveEventRestorationContractBody(
  scenario: EventRestorationScenario,
): EventRestorationResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return eventRestorationContractLiveFullResponse;
    case "contract_empty_page":
      return eventRestorationContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const EventRestorationData = {
  fromDate: eventRestorationDefaultFromDate,
  toDate: eventRestorationDefaultToDate,
  page: eventRestorationDefaultPage,
  limit: eventRestorationDefaultLimit,
  maxResponseTime: eventRestorationMaxResponseTimeMs,
  columnKeys: eventRestorationColumnKeys,
};

export const eventRestorationTestCases: EventRestorationTestCase[] = [
  {
    testName:
      "Event restoration — 1–30 Oct 2025 first page shows columns and occurrences",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@reports", "@event-restoration"],
    nonEmptyExpected: true,
  },
  {
    testName:
      "Event restoration — page 2 continues serial numbers without duplicates",
    scenario: "dev_live_page2",
    tags: ["@reports", "@event-restoration", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "Event restoration — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@event-restoration", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@event-restoration", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@event-restoration", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — 1–30 Oct 2025 fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@event-restoration", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@event-restoration", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — invalid toDate is rejected",
    scenario: "invalid_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event restoration — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@event-restoration", "@negative"],
    nonEmptyExpected: false,
  },
];
