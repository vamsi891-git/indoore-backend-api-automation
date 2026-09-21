import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrEventQuery as DtrEventApiQuery } from "../Api/dtrevent.api";
import type {
  DtrEventResponse,
  DtrEventScenario,
} from "../Mapper/dtrevent.mapper";
import { dtrEventColumnKeys } from "../Mapper/dtrevent.mapper";

export type DtrEventQuery = DtrEventApiQuery & {
  foo?: string;
  unused?: number;
};

export const dtrEventMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary window — 1–30 Oct 2025. */
export const dtrEventDefaultFromDate = "2025-10-01";
export const dtrEventDefaultToDate = "2025-10-30";
export const dtrEventDefaultPage = 1;
export const dtrEventDefaultLimit = 10;
/** Live Oct range has ~80 pages. */
export const dtrEventBeyondPage = 9999;

export const dtrEventExpectedColumns = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dt", header: "DTR" },
  { key: "dtrMeterNo", header: "DTR Meter No" },
  { key: "dtrRatingKva", header: "DTR Rating (kVA)" },
  { key: "eventCount", header: "Event Count" },
  { key: "durationHhMmSs", header: "Duration (HH:MM:SS)" },
] as const;

function primaryQuery(overrides: Partial<DtrEventQuery> = {}): DtrEventQuery {
  return {
    fromDate: dtrEventDefaultFromDate,
    toDate: dtrEventDefaultToDate,
    page: dtrEventDefaultPage,
    limit: dtrEventDefaultLimit,
    ...overrides,
  };
}

export const dtrEventContractLiveFullResponse: DtrEventResponse = {
  success: true,
  data: {
    columns: [...dtrEventExpectedColumns],
    rows: [
      {
        id: "row-1-533-19271401",
        slNo: 1,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "MPSRTC",
        feeder: "MECHANIC NAGAR(CHQ)",
        dt: "MM524",
        dtrMeterNo: "19271401",
        dtrRatingKva: null,
        eventCount: 99,
        durationHhMmSs: "173:24:00",
        dtrNetworkLookupId: 533,
        meterLookupId: 120905,
        eventId: 529,
      },
      {
        id: "row-2-748-19272118",
        slNo: 2,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "Gandhi Nagar",
        feeder: "GANDHINAGAR(CHQ)",
        dt: "WI7114",
        dtrMeterNo: "19272118",
        dtrRatingKva: 100,
        eventCount: 55,
        durationHhMmSs: "07:02:00",
        dtrNetworkLookupId: 748,
        meterLookupId: 90833,
        eventId: 529,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 794,
      totalPages: 80,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const dtrEventContractEmptyPageResponse: DtrEventResponse = {
  success: true,
  data: {
    columns: [...dtrEventExpectedColumns],
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

export interface DtrEventTestCase {
  testName: string;
  scenario: DtrEventScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDtrEventQuery(scenario: DtrEventScenario): DtrEventQuery {
  switch (scenario) {
    case "dev_live_page2":
      return primaryQuery({ page: 2 });
    case "dev_live_page_beyond":
      return primaryQuery({ page: dtrEventBeyondPage });
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

export function resolveDtrEventContractBody(
  scenario: DtrEventScenario,
): DtrEventResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return dtrEventContractLiveFullResponse;
    case "contract_empty_page":
      return dtrEventContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const DtrEventData = {
  fromDate: dtrEventDefaultFromDate,
  toDate: dtrEventDefaultToDate,
  page: dtrEventDefaultPage,
  limit: dtrEventDefaultLimit,
  maxResponseTime: dtrEventMaxResponseTimeMs,
  columnKeys: dtrEventColumnKeys,
};

export const dtrEventTestCases: DtrEventTestCase[] = [
  {
    testName: "DTR event — 1–30 Oct 2025 first page shows columns and DTRs",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@reports", "@dtr-event"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR event — page 2 continues serial numbers without duplicates",
    scenario: "dev_live_page2",
    tags: ["@reports", "@dtr-event", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@dtr-event", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@dtr-event", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@dtr-event", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — 1–30 Oct 2025 fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@dtr-event", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@dtr-event", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — invalid toDate is rejected",
    scenario: "invalid_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR event — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-event", "@negative"],
    nonEmptyExpected: false,
  },
];
