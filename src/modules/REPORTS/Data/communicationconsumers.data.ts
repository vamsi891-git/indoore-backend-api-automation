import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CommunicationConsumersQuery as CommunicationConsumersApiQuery } from "../Api/communicationconsumers.api";
import type {
  CommunicationConsumersColumn,
  CommunicationConsumersResponse,
  CommunicationConsumersScenario,
} from "../Mapper/communicationconsumers.mapper";

export type CommunicationConsumersQuery = CommunicationConsumersApiQuery & {
  foo?: string;
  unused?: number;
};

export const communicationConsumersMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const communicationConsumersDefaultPeriodType = "day" as const;
export const communicationConsumersDefaultDate = "2025-10-01";
export const communicationConsumersDefaultMonth = "2025-10";
export const communicationConsumersDefaultFromDate = "2025-10-01";
export const communicationConsumersDefaultToDate = "2025-10-30";
export const communicationConsumersDefaultPage = 1;
export const communicationConsumersDefaultLimit = 50;
export const communicationConsumersBeyondPage = 9999;
export const communicationConsumersDefaultMeterType = "all";
export const communicationConsumersDefaultMappingType = "all";

export const communicationConsumersExpectedColumns: CommunicationConsumersColumn[] =
  [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "substation", header: "Sub Station" },
    { key: "feeder", header: "Feeder" },
    { key: "dtrName", header: "DTR Name" },
    { key: "consumerName", header: "Consumer Name" },
    { key: "address", header: "Address" },
    { key: "ivrsNumber", header: "IVRS Number" },
    { key: "tariff", header: "Tariff" },
    { key: "msn", header: "MSN" },
    { key: "phase", header: "Phase" },
    { key: "meterMake", header: "Meter Make" },
    { key: "mf", header: "MF" },
    { key: "ipCount", header: "IP Count" },
    { key: "dpCount", header: "DP Count" },
    { key: "lsCount", header: "LS Count" },
  ];

function primaryQuery(
  overrides: Partial<CommunicationConsumersQuery> = {},
): CommunicationConsumersQuery {
  return {
    periodType: communicationConsumersDefaultPeriodType,
    date: communicationConsumersDefaultDate,
    page: communicationConsumersDefaultPage,
    limit: communicationConsumersDefaultLimit,
    meterType: communicationConsumersDefaultMeterType,
    mappingType: communicationConsumersDefaultMappingType,
    ...overrides,
  };
}

export const communicationConsumersContractLiveDayResponse: CommunicationConsumersResponse =
  {
    success: true,
    data: {
      columns: communicationConsumersExpectedColumns,
      rows: [
        {
          id: "row-1-85080223-1095",
          meterLookupId: 1095,
          consumerName: "M/S LAJWAN STEEL",
          circle: "Indore city circle",
          division: "SOUTH",
          zone: "OPH South",
          substation: "PragatiNagar",
          feeder: "PARMANU NAGAR(CHQ)",
          dtrName: "RJ666",
          address: "27-S-5 JAWAHAR NAGARINDOREINDORE",
          ivrsNumber: "3544019391",
          tariff: "LV1.2",
          msn: "85080223",
          phase: "1 PH",
          meterMake: "L&T",
          mf: "1",
          ipCount: 95,
          dpCount: 1,
          lsCount: 96,
          billingCount: 1,
          billingMappingStatus: "OK",
          eventCount: 1,
        },
        {
          id: "row-2-85080810-1099",
          meterLookupId: 1099,
          consumerName: "SUNIL GUNVANTSINH THAKUR",
          circle: "Indore city circle",
          division: "CENTRAL",
          zone: "Hawabangla",
          substation: "PragatiNagar",
          feeder: "PARMANU NAGAR(CHQ)",
          dtrName: "RJ666",
          address: "30 S-5 JAWAHAR NAGARINDOREINDORE",
          ivrsNumber: "N3008013679",
          tariff: "LV1.2",
          msn: "85080810",
          phase: "1 PH",
          meterMake: "L&T",
          mf: "1",
          ipCount: 95,
          dpCount: 1,
          lsCount: 96,
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

export const communicationConsumersContractEmptyPageResponse: CommunicationConsumersResponse =
  {
    success: true,
    data: {
      columns: communicationConsumersExpectedColumns,
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

export interface CommunicationConsumersTestCase {
  testName: string;
  scenario: CommunicationConsumersScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

export function resolveCommunicationConsumersQuery(
  scenario: CommunicationConsumersScenario,
): CommunicationConsumersQuery {
  switch (scenario) {
    case "dev_live_month":
      return primaryQuery({
        periodType: "month",
        date: undefined,
        month: communicationConsumersDefaultMonth,
      });
    case "dev_live_range":
      return primaryQuery({
        periodType: "range",
        date: undefined,
        fromDate: communicationConsumersDefaultFromDate,
        toDate: communicationConsumersDefaultToDate,
      });
    case "dev_live_page_beyond":
      return primaryQuery({ page: communicationConsumersBeyondPage });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "invalid_period_type":
      return primaryQuery({ periodType: "week" });
    case "invalid_date":
      return primaryQuery({ date: "not-a-date" });
    case "missing_date":
      return primaryQuery({ date: undefined });
    case "missing_month":
      return primaryQuery({
        periodType: "month",
        date: undefined,
        month: undefined,
      });
    case "invalid_date_range":
      return primaryQuery({
        periodType: "range",
        date: undefined,
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "missing_from_date":
      return primaryQuery({
        periodType: "range",
        date: undefined,
        toDate: communicationConsumersDefaultToDate,
      });
    case "invalid_meter_type":
      return primaryQuery({ meterType: "xyz" });
    case "dev_live_day":
    case "contract_live_day":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveCommunicationConsumersContractBody(
  scenario: CommunicationConsumersScenario,
): CommunicationConsumersResponse | undefined {
  switch (scenario) {
    case "contract_live_day":
      return communicationConsumersContractLiveDayResponse;
    case "contract_empty_page":
      return communicationConsumersContractEmptyPageResponse;
    default:
      return undefined;
  }
}

export const communicationConsumersTestCases: CommunicationConsumersTestCase[] =
  [
    {
      testName:
        "Communication consumers — day first page shows columns and meters",
      scenario: "dev_live_day",
      tags: ["@smoke", "@reports", "@communication-consumers"],
    },
    {
      testName:
        "Communication consumers — month first page shows columns and meters",
      scenario: "dev_live_month",
      tags: ["@reports", "@communication-consumers", "@matrix"],
    },
    {
      testName:
        "Communication consumers — range first page shows columns and meters",
      scenario: "dev_live_range",
      tags: ["@reports", "@communication-consumers", "@matrix"],
    },
    {
      testName:
        "Communication consumers — showing 1 per page returns at most 1 record",
      scenario: "dev_limit_one",
      tags: ["@reports", "@communication-consumers", "@edge"],
    },
    {
      testName:
        "Communication consumers — a page past the last page shows no records",
      scenario: "dev_live_page_beyond",
      tags: ["@reports", "@communication-consumers", "@edge"],
    },
    {
      testName: "Communication consumers — unknown query params are ignored",
      scenario: "dev_ignore_unknown_query",
      tags: ["@reports", "@communication-consumers", "@edge"],
    },
    {
      testName: "Communication consumers — 1 Oct 2025 day fixture",
      scenario: "contract_live_day",
      isContractFixture: true,
      tags: ["@reports", "@communication-consumers", "@edge"],
    },
    {
      testName: "Communication consumers — empty page fixture",
      scenario: "contract_empty_page",
      isContractFixture: true,
      tags: ["@reports", "@communication-consumers", "@edge"],
    },
    {
      testName: "Communication consumers — invalid period type is rejected",
      scenario: "invalid_period_type",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
    {
      testName: "Communication consumers — invalid date is rejected",
      scenario: "invalid_date",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
    {
      testName: "Communication consumers — missing date for day is rejected",
      scenario: "missing_date",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
    {
      testName: "Communication consumers — missing month is rejected",
      scenario: "missing_month",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
    {
      testName: "Communication consumers — fromDate after toDate is rejected",
      scenario: "invalid_date_range",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
    {
      testName: "Communication consumers — missing fromDate is rejected",
      scenario: "missing_from_date",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
    {
      testName: "Communication consumers — invalid meter type is rejected",
      scenario: "invalid_meter_type",
      expectedStatus: 400,
      tags: ["@reports", "@communication-consumers", "@negative"],
    },
  ];
