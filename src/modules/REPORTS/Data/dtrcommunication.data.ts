import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrCommunicationReportQuery as DtrCommunicationReportApiQuery } from "../Api/dtrcommunication.api";
import type {
  DtrCommunicationReportColumn,
  DtrCommunicationReportResponse,
  DtrCommunicationReportScenario,
} from "../Mapper/dtrcommunication.mapper";
import { dtrCommunicationReportColumnKeys } from "../Mapper/dtrcommunication.mapper";

export type DtrCommunicationReportQuery = DtrCommunicationReportApiQuery & {
  foo?: string;
  unused?: number;
};

export const dtrCommunicationReportMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — 1–30 Oct 2025, includeTotal=false, includeArchiveCounts=true. */
export const dtrCommunicationReportDefaultFromDate = "2025-10-01";
export const dtrCommunicationReportDefaultToDate = "2025-10-30";
export const dtrCommunicationReportDefaultPage = 1;
export const dtrCommunicationReportDefaultLimit = 10;
export const dtrCommunicationReportBeyondPage = 99;

export const dtrCommunicationReportExpectedColumns: DtrCommunicationReportColumn[] =
  [
    { key: "slNo", header: "S No." },
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Substation" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "meterSerialNumber", header: "Meter Serial Number" },
    { key: "logDate", header: "Log Date" },
    { key: "ipCount", header: "IP Count" },
    { key: "lsCount", header: "LS Count" },
    { key: "dpCount", header: "DP Count" },
  ];

function primaryQuery(
  overrides: Partial<DtrCommunicationReportQuery> = {},
): DtrCommunicationReportQuery {
  return {
    fromDate: dtrCommunicationReportDefaultFromDate,
    toDate: dtrCommunicationReportDefaultToDate,
    page: dtrCommunicationReportDefaultPage,
    limit: dtrCommunicationReportDefaultLimit,
    includeTotal: false,
    includeArchiveCounts: true,
    ...overrides,
  };
}

/** Live sample: 1–30 Oct 2025, includeTotal=false (first 2 rows). */
export const dtrCommunicationReportContractLiveFullResponse: DtrCommunicationReportResponse =
  {
    success: true,
    data: {
      columns: [...dtrCommunicationReportExpectedColumns],
      rows: [
        {
          id: "row-1-19271956-88544",
          slNo: 1,
          circle: "Indore city circle",
          division: "SOUTH",
          zone: "OPH South",
          subStation: "PAGNISPAGA",
          feeder: "MOTITABBALA(CHQ)",
          dtr: "34SO21",
          meterSerialNumber: "19271956",
          logDate: "30/10/2025 00:00:00",
          ipCount: 0,
          lsCount: 0,
          dpCount: 0,
          meterLookupId: 88544,
        },
        {
          id: "row-2-19271924-120931",
          slNo: 2,
          circle: "Indore city circle",
          division: "SOUTH",
          zone: "OPH South",
          subStation: "PAGNISPAGA",
          feeder: "MOTITABBALA(CHQ)",
          dtr: "34SO32",
          meterSerialNumber: "19271924",
          logDate: "30/10/2025 00:00:00",
          ipCount: 0,
          lsCount: 0,
          dpCount: 0,
          meterLookupId: 120931,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: null,
        totalPages: null,
        totalIsExact: false,
        hasMore: true,
      },
    },
  };

export const dtrCommunicationReportContractEmptyPageResponse: DtrCommunicationReportResponse =
  {
    success: true,
    data: {
      columns: [...dtrCommunicationReportExpectedColumns],
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

export interface DtrCommunicationReportTestCase {
  testName: string;
  scenario: DtrCommunicationReportScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDtrCommunicationReportQuery(
  scenario: DtrCommunicationReportScenario,
): DtrCommunicationReportQuery {
  switch (scenario) {
    case "dev_live_include_total":
      return primaryQuery({ includeTotal: true });
    case "dev_live_archive_false":
      return primaryQuery({ includeArchiveCounts: false });
    case "dev_live_page_beyond":
      return primaryQuery({ page: dtrCommunicationReportBeyondPage });
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

export function resolveDtrCommunicationReportContractBody(
  scenario: DtrCommunicationReportScenario,
): DtrCommunicationReportResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return dtrCommunicationReportContractLiveFullResponse;
    case "contract_empty_page":
      return dtrCommunicationReportContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const DtrCommunicationReportData = {
  fromDate: dtrCommunicationReportDefaultFromDate,
  toDate: dtrCommunicationReportDefaultToDate,
  page: dtrCommunicationReportDefaultPage,
  limit: dtrCommunicationReportDefaultLimit,
  maxResponseTime: dtrCommunicationReportMaxResponseTimeMs,
  columnKeys: dtrCommunicationReportColumnKeys,
};

export const dtrCommunicationReportTestCases: DtrCommunicationReportTestCase[] =
  [
    {
      testName:
        "DTR communication — 1–30 Oct 2025 first page shows columns and meters",
      scenario: "dev_live_primary",
      tags: ["@smoke", "@reports", "@dtr-communication"],
      nonEmptyExpected: true,
    },
    {
      testName: "DTR communication — includeTotal still shows the same columns",
      scenario: "dev_live_include_total",
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName:
        "DTR communication — includeArchiveCounts=false still returns the grid",
      scenario: "dev_live_archive_false",
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName:
        "DTR communication — showing 1 per page returns at most 1 record",
      scenario: "dev_limit_one",
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — a far page still returns a valid table",
      scenario: "dev_live_page_beyond",
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — unknown query params are ignored",
      scenario: "dev_ignore_unknown_query",
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName:
        "DTR communication — Oct 2025 fixture (includeTotal=false)",
      scenario: "contract_live_full",
      isContractFixture: true,
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — empty page fixture",
      scenario: "contract_empty_page",
      isContractFixture: true,
      tags: ["@reports", "@dtr-communication", "@edge"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — fromDate after toDate is rejected",
      scenario: "invalid_date_range",
      expectedStatus: 400,
      tags: ["@reports", "@dtr-communication", "@negative"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — invalid fromDate is rejected",
      scenario: "invalid_date_format",
      expectedStatus: 400,
      tags: ["@reports", "@dtr-communication", "@negative"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — missing fromDate is rejected",
      scenario: "missing_from_date",
      expectedStatus: 400,
      tags: ["@reports", "@dtr-communication", "@negative"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — missing toDate is rejected",
      scenario: "missing_to_date",
      expectedStatus: 400,
      tags: ["@reports", "@dtr-communication", "@negative"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — page 0 is rejected (page must start at 1)",
      scenario: "invalid_page",
      expectedStatus: 400,
      tags: ["@reports", "@dtr-communication", "@negative"],
      nonEmptyExpected: false,
    },
    {
      testName: "DTR communication — limit 0 is rejected (limit must be at least 1)",
      scenario: "invalid_limit",
      expectedStatus: 400,
      tags: ["@reports", "@dtr-communication", "@negative"],
      nonEmptyExpected: false,
    },
  ];
