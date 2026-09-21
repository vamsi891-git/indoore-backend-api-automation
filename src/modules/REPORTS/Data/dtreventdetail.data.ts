import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrEventDetailQuery as DtrEventDetailApiQuery } from "../Api/dtreventdetail.api";
import type {
  DtrEventDetailColumn,
  DtrEventDetailResponse,
  DtrEventDetailScenario,
} from "../Mapper/dtreventdetail.mapper";
import { dtrEventDetailColumnKeys } from "../Mapper/dtreventdetail.mapper";

export type DtrEventDetailQuery = DtrEventDetailApiQuery & {
  foo?: string;
  unused?: number;
};

export const dtrEventDetailMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrEventDetailDefaultFromDate = "2025-10-01";
export const dtrEventDetailDefaultToDate = "2025-10-30";
export const dtrEventDetailDefaultPage = 1;
export const dtrEventDetailDefaultLimit = 10;
/** Live Oct range has ~1889 pages. */
export const dtrEventDetailBeyondPage = 99999;

export const dtrEventDetailExpectedColumns: DtrEventDetailColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "dtrType", header: "DTR Type" },
  { key: "dtrRating", header: "DTR Rating" },
  { key: "msn", header: "MSN" },
  { key: "logDate", header: "Log Date" },
  { key: "eventClassificationName", header: "Event Classification" },
  { key: "eventName", header: "Event Name" },
  { key: "priority", header: "Priority" },
  { key: "eventCount", header: "Event Count" },
  { key: "durationHhMm", header: "Duration (DD:HH:MM)" },
];

function primaryQuery(
  overrides: Partial<DtrEventDetailQuery> = {},
): DtrEventDetailQuery {
  return {
    fromDate: dtrEventDetailDefaultFromDate,
    toDate: dtrEventDetailDefaultToDate,
    page: dtrEventDetailDefaultPage,
    limit: dtrEventDetailDefaultLimit,
    ...overrides,
  };
}

export const dtrEventDetailContractLiveFullResponse: DtrEventDetailResponse = {
  success: true,
  data: {
    columns: [...dtrEventDetailExpectedColumns],
    rows: [
      {
        id: "row-1-19271510-110783-551",
        slNo: 1,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "Tejaji Nagar",
        feeder: "SHIV DHAM(FS-DLF)",
        dtr: "83SU3",
        dtrType: "",
        dtrRating: 200,
        msn: "19271510",
        logDate: "2025-10-30",
        eventClassificationName: "Current",
        eventName: "Phase R - Current reverse",
        priority: "Priority4",
        eventCount: 6,
        durationHhMm: "1:06:00",
        dtrNetworkLookupId: 245,
        meterLookupId: 110783,
        eventId: 551,
      },
      {
        id: "row-2-19271510-110783-553",
        slNo: 2,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "Tejaji Nagar",
        feeder: "SHIV DHAM(FS-DLF)",
        dtr: "83SU3",
        dtrType: "",
        dtrRating: 200,
        msn: "19271510",
        logDate: "2025-10-30",
        eventClassificationName: "Current",
        eventName: "Phase B - Current reverse",
        priority: "Priority4",
        eventCount: 5,
        durationHhMm: "1:05:47",
        dtrNetworkLookupId: 245,
        meterLookupId: 110783,
        eventId: 553,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 18888,
      totalPages: 1889,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const dtrEventDetailContractEmptyPageResponse: DtrEventDetailResponse = {
  success: true,
  data: {
    columns: [...dtrEventDetailExpectedColumns],
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

export interface DtrEventDetailTestCase {
  testName: string;
  scenario: DtrEventDetailScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDtrEventDetailQuery(
  scenario: DtrEventDetailScenario,
): DtrEventDetailQuery {
  switch (scenario) {
    case "dev_live_page2":
      return primaryQuery({ page: 2 });
    case "dev_live_page_beyond":
      return primaryQuery({ page: dtrEventDetailBeyondPage });
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

export function resolveDtrEventDetailContractBody(
  scenario: DtrEventDetailScenario,
): DtrEventDetailResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return dtrEventDetailContractLiveFullResponse;
    case "contract_empty_page":
      return dtrEventDetailContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const DtrEventDetailData = {
  fromDate: dtrEventDetailDefaultFromDate,
  toDate: dtrEventDetailDefaultToDate,
  page: dtrEventDetailDefaultPage,
  limit: dtrEventDetailDefaultLimit,
  maxResponseTime: dtrEventDetailMaxResponseTimeMs,
  columnKeys: dtrEventDetailColumnKeys,
};

export const dtrEventDetailTestCases: DtrEventDetailTestCase[] = [
  {
    testName:
      "DTR event detail — 1–30 Oct 2025 first page shows columns and events",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@reports", "@dtr-event-detail"],
    nonEmptyExpected: true,
  },
  {
    testName:
      "DTR event detail — page 2 continues serial numbers without duplicates",
    scenario: "dev_live_page2",
    tags: ["@reports", "@dtr-event-detail", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "DTR event detail — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@dtr-event-detail", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@dtr-event-detail", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@dtr-event-detail", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — 1–30 Oct 2025 fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@dtr-event-detail", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@dtr-event-detail", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — invalid toDate is rejected",
    scenario: "invalid_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event detail — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event-detail", "@negative"],
    nonEmptyExpected: false,
  },
];
