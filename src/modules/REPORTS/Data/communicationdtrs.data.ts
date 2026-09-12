import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CommunicationDtrsQuery as CommunicationDtrsApiQuery } from "../Api/communicationdtrs.api";
import type {
  CommunicationDtrsColumn,
  CommunicationDtrsResponse,
  CommunicationDtrsScenario,
} from "../Mapper/communicationdtrs.mapper";

export type CommunicationDtrsQuery = CommunicationDtrsApiQuery & {
  foo?: string;
  unused?: number;
};

export const communicationDtrsMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const communicationDtrsDefaultPeriodType = "month" as const;
export const communicationDtrsDefaultDate = "2025-10-01";
export const communicationDtrsDefaultMonth = "2025-10";
export const communicationDtrsDefaultFromDate = "2025-10-01";
export const communicationDtrsDefaultToDate = "2025-10-30";
export const communicationDtrsDefaultPage = 1;
export const communicationDtrsDefaultLimit = 50;
export const communicationDtrsBeyondPage = 9999;

export const communicationDtrsExpectedColumns: CommunicationDtrsColumn[] = [
  { key: "slNo", header: "Sl.No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feederName", header: "Feeder Name" },
  { key: "dtrName", header: "DTR Name" },
  { key: "feederCode", header: "Feeder Code" },
  { key: "dtrCode", header: "DTR Code" },
  { key: "newDtrCode", header: "New DTR Code" },
  { key: "dtrCapacity", header: "DTR Capacity" },
  { key: "meterSerialNumber", header: "Meter SL No" },
  { key: "meterMake", header: "Meter Make" },
  { key: "mf", header: "MF" },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "serviceDate", header: "ServiceDate" },
  { key: "ipCount", header: "IP Count" },
  { key: "dpCount", header: "DP Count" },
  { key: "lsCount", header: "LS Count" },
];

function primaryQuery(
  overrides: Partial<CommunicationDtrsQuery> = {},
): CommunicationDtrsQuery {
  return {
    periodType: communicationDtrsDefaultPeriodType,
    month: communicationDtrsDefaultMonth,
    page: communicationDtrsDefaultPage,
    limit: communicationDtrsDefaultLimit,
    ...overrides,
  };
}

export const communicationDtrsContractLiveMonthResponse: CommunicationDtrsResponse =
  {
    success: true,
    data: {
      columns: communicationDtrsExpectedColumns,
      rows: [
        {
          id: "row-1-19271632-19",
          slNo: 1,
          dtrNetworkLookupId: 19,
          meterLookupId: 108401,
          circle: "Indore city circle",
          division: "CENTRAL",
          zone: "Hawabangla",
          subStation: "PragatiNagar",
          feederName: "Parmanu Nagar",
          dtrName: "RJ662",
          feederCode: "F3",
          dtrCode: "RJ662",
          newDtrCode: "HBZ0000109",
          dtrCapacity: "100",
          meterSerialNumber: "19271632",
          meterMake: "L&T",
          mf: "40",
          latitude: "22.672940",
          longitude: "75.824139",
          serviceDate: "2019-12-17 14:27:41.44",
          ipCount: 0,
          dpCount: 0,
          lsCount: 0,
          billingCount: 1,
          billingMappingStatus: "OK",
          eventCount: 0,
        },
        {
          id: "row-2-19271036-20",
          slNo: 2,
          dtrNetworkLookupId: 20,
          meterLookupId: 78642,
          circle: "Indore city circle",
          division: "CENTRAL",
          zone: "Hawabangla",
          subStation: "PragatiNagar",
          feederName: "Parmanu Nagar",
          dtrName: "RJ664",
          feederCode: "F3",
          dtrCode: "RJ664",
          newDtrCode: "HBZ0000091",
          dtrCapacity: "200",
          meterSerialNumber: "19271036",
          meterMake: "L&T",
          mf: "40",
          latitude: "22.671483",
          longitude: "75.824953",
          serviceDate: "2019-07-19 12:03:03.42",
          ipCount: 0,
          dpCount: 0,
          lsCount: 0,
          billingCount: 1,
          billingMappingStatus: "OK",
          eventCount: 0,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: null,
        totalPages: null,
        totalIsExact: false,
        hasMore: true,
      },
    },
  };

export const communicationDtrsContractEmptyPageResponse: CommunicationDtrsResponse =
  {
    success: true,
    data: {
      columns: communicationDtrsExpectedColumns,
      rows: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        totalIsExact: true,
        hasMore: false,
      },
    },
  };

export interface CommunicationDtrsTestCase {
  testName: string;
  scenario: CommunicationDtrsScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

export function resolveCommunicationDtrsQuery(
  scenario: CommunicationDtrsScenario,
): CommunicationDtrsQuery {
  switch (scenario) {
    case "dev_live_day":
      return primaryQuery({
        periodType: "day",
        month: undefined,
        date: communicationDtrsDefaultDate,
      });
    case "dev_live_range":
      return primaryQuery({
        periodType: "range",
        month: undefined,
        fromDate: communicationDtrsDefaultFromDate,
        toDate: communicationDtrsDefaultToDate,
      });
    case "dev_live_page_beyond":
      return primaryQuery({ page: communicationDtrsBeyondPage });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "invalid_period_type":
      return primaryQuery({ periodType: "week" });
    case "invalid_date":
      return primaryQuery({
        periodType: "day",
        month: undefined,
        date: "not-a-date",
      });
    case "missing_date":
      return primaryQuery({
        periodType: "day",
        month: undefined,
        date: undefined,
      });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "invalid_date_range":
      return primaryQuery({
        periodType: "range",
        month: undefined,
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "missing_from_date":
      return primaryQuery({
        periodType: "range",
        month: undefined,
        toDate: communicationDtrsDefaultToDate,
      });
    case "dev_live_month":
    case "contract_live_month":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveCommunicationDtrsContractBody(
  scenario: CommunicationDtrsScenario,
): CommunicationDtrsResponse | undefined {
  switch (scenario) {
    case "contract_live_month":
      return communicationDtrsContractLiveMonthResponse;
    case "contract_empty_page":
      return communicationDtrsContractEmptyPageResponse;
    default:
      return undefined;
  }
}

export const communicationDtrsTestCases: CommunicationDtrsTestCase[] = [
  {
    testName: "Communication DTRs — month first page shows columns and DTRs",
    scenario: "dev_live_month",
    tags: ["@smoke", "@reports", "@communication-dtrs"],
  },
  {
    testName: "Communication DTRs — day first page shows columns and DTRs",
    scenario: "dev_live_day",
    tags: ["@reports", "@communication-dtrs", "@matrix"],
  },
  {
    testName: "Communication DTRs — range first page shows columns and DTRs",
    scenario: "dev_live_range",
    tags: ["@reports", "@communication-dtrs", "@matrix"],
  },
  {
    testName:
      "Communication DTRs — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@communication-dtrs", "@edge"],
  },
  {
    testName: "Communication DTRs — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@communication-dtrs", "@edge"],
  },
  {
    testName: "Communication DTRs — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@communication-dtrs", "@edge"],
  },
  {
    testName: "Communication DTRs — Oct 2025 month fixture",
    scenario: "contract_live_month",
    isContractFixture: true,
    tags: ["@reports", "@communication-dtrs", "@edge"],
  },
  {
    testName: "Communication DTRs — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@communication-dtrs", "@edge"],
  },
  {
    testName: "Communication DTRs — invalid period type is rejected",
    scenario: "invalid_period_type",
    expectedStatus: 400,
    tags: ["@reports", "@communication-dtrs", "@negative"],
  },
  {
    testName: "Communication DTRs — invalid date is rejected",
    scenario: "invalid_date",
    expectedStatus: 400,
    tags: ["@reports", "@communication-dtrs", "@negative"],
  },
  {
    testName: "Communication DTRs — missing date for day is rejected",
    scenario: "missing_date",
    expectedStatus: 400,
    tags: ["@reports", "@communication-dtrs", "@negative"],
  },
  {
    testName: "Communication DTRs — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@reports", "@communication-dtrs", "@negative"],
  },
  {
    testName: "Communication DTRs — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@communication-dtrs", "@negative"],
  },
  {
    testName: "Communication DTRs — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@communication-dtrs", "@negative"],
  },
];
