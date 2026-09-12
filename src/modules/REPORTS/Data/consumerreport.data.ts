import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerReportQuery as ConsumerReportApiQuery } from "../Api/consumerreport.api";
import type {
  ConsumerReportColumn,
  ConsumerReportResponse,
  ConsumerReportScenario,
  ConsumerReportType,
} from "../Mapper/consumerreport.mapper";

export type ConsumerReportQuery = ConsumerReportApiQuery & {
  foo?: string;
  unused?: number;
};

export const consumerReportMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const consumerReportDefaultFromDate = "2025-10-01";
export const consumerReportDefaultToDate = "2025-10-30";
export const consumerReportDefaultMeterSerial = "14080783";
export const consumerReportDefaultPage = 1;
export const consumerReportDefaultLimit = 10;
export const consumerReportBeyondPage = 9999;
export const consumerReportDefaultType: ConsumerReportType = "ls";

export const consumerReportLsColumns: ConsumerReportColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "dateTime", header: "Date Time" },
  { key: "voltage", header: "Voltage" },
  { key: "current", header: "Current" },
  { key: "kWh", header: "kWh" },
  { key: "kVAh", header: "kVAh" },
];

export const consumerReportDpColumns: ConsumerReportColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "name", header: "Consumer Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "msn", header: "MSN" },
  { key: "dateTime", header: "Date Time" },
  { key: "kWh", header: "kWh" },
  { key: "kVAh", header: "kVAh" },
  { key: "mf", header: "MF" },
];

export const consumerReportIpColumns: ConsumerReportColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "name", header: "Consumer Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "msn", header: "Meter Serial No." },
  { key: "dateTime", header: "Date Time" },
  { key: "voltage", header: "Voltage" },
  { key: "cur", header: "Current" },
  { key: "pf", header: "PF" },
  { key: "kW", header: "kW" },
  { key: "kWh", header: "kWh" },
  { key: "kva", header: "kVA" },
  { key: "kVAh", header: "kVAh" },
  { key: "freq", header: "Frequency" },
  { key: "neutralCurrent", header: "Neutral Current" },
  { key: "sourceId", header: "Source ID" },
  { key: "mf", header: "MF" },
];

export function consumerReportExpectedColumns(
  reportType: ConsumerReportType,
): ConsumerReportColumn[] {
  if (reportType === "dp") return consumerReportDpColumns;
  if (reportType === "ip") return consumerReportIpColumns;
  return consumerReportLsColumns;
}

function primaryQuery(
  overrides: Partial<ConsumerReportQuery> = {},
): ConsumerReportQuery {
  return {
    fromDate: consumerReportDefaultFromDate,
    toDate: consumerReportDefaultToDate,
    meterSerialNumber: consumerReportDefaultMeterSerial,
    "report-type": consumerReportDefaultType,
    page: consumerReportDefaultPage,
    limit: consumerReportDefaultLimit,
    includeTotal: true,
    ...overrides,
  };
}

const dpConsumer = {
  name: "SHAILJA KARKARE",
  address: "25/1/2/4 HRS HERITEJRETI MUNDI F.NO. 401INDORE",
  ivrsNumber: "N3008001961",
  msn: consumerReportDefaultMeterSerial,
};

export const consumerReportContractLiveLsResponse: ConsumerReportResponse = {
  success: true,
  data: {
    columns: consumerReportLsColumns,
    rows: [
      {
        id: "row-1",
        slNo: 1,
        dateTime: "2025-10-01 00:00",
        voltage: "250.100",
        current: "0.090",
        kWh: "0.00",
        kVAh: "0.00",
        phases: null,
      },
      {
        id: "row-2",
        slNo: 2,
        dateTime: "2025-10-01 00:15",
        voltage: "250.950",
        current: "0.090",
        kWh: "0.01",
        kVAh: "0.01",
        phases: null,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2877,
      totalPages: 288,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const consumerReportContractLiveDpResponse: ConsumerReportResponse = {
  success: true,
  data: {
    columns: consumerReportDpColumns,
    rows: [
      {
        id: "row-1-14080783",
        slNo: 1,
        ...dpConsumer,
        dateTime: "2025-10-01 00:00:00",
        kWh: "1773.00",
        kVAh: "1889.35",
        mf: "1",
      },
      {
        id: "row-2-14080783",
        slNo: 2,
        ...dpConsumer,
        dateTime: "2025-10-02 00:00:00",
        kWh: "1773.37",
        kVAh: "1889.77",
        mf: "1",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 30,
      totalPages: 3,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const consumerReportContractLiveIpResponse: ConsumerReportResponse = {
  success: true,
  data: {
    columns: consumerReportIpColumns,
    rows: [
      {
        id: "row-1-14080783",
        slNo: 1,
        ...dpConsumer,
        dateTime: "2025-10-30 23:45:22",
        voltage: "250.340",
        cur: "0.000",
        pf: "-0.470",
        kW: "0.000",
        kWh: "1788.42",
        kva: "0.010",
        kVAh: "1906.46",
        freq: "49.900",
        neutralCurrent: "0.000",
        sourceId: "1",
        mf: "1",
      },
      {
        id: "row-2-14080783",
        slNo: 2,
        ...dpConsumer,
        dateTime: "2025-10-30 23:30:22",
        voltage: "249.740",
        cur: "0.000",
        pf: "-0.470",
        kW: "0.000",
        kWh: "1788.42",
        kva: "0.010",
        kVAh: "1906.45",
        freq: "49.900",
        neutralCurrent: "0.000",
        sourceId: "1",
        mf: "1",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2855,
      totalPages: 286,
      totalIsExact: true,
      hasMore: true,
    },
  },
};

export const consumerReportContractEmptyPageResponse: ConsumerReportResponse = {
  success: true,
  data: {
    columns: consumerReportLsColumns,
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

export interface ConsumerReportTestCase {
  testName: string;
  scenario: ConsumerReportScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

export function resolveConsumerReportQuery(
  scenario: ConsumerReportScenario,
): ConsumerReportQuery {
  switch (scenario) {
    case "dev_live_dp":
      return primaryQuery({ "report-type": "dp" });
    case "dev_live_ip":
      return primaryQuery({ "report-type": "ip" });
    case "dev_live_ls_without_total":
      return primaryQuery({ includeTotal: false });
    case "dev_live_page_beyond":
      return primaryQuery({ page: consumerReportBeyondPage });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "invalid_report_type":
      return primaryQuery({ "report-type": "xyz" });
    case "invalid_date_range":
      return primaryQuery({
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "invalid_date_format":
      return primaryQuery({ fromDate: "not-a-date" });
    case "missing_from_date":
      return primaryQuery({ fromDate: undefined });
    case "missing_meter_serial":
      return primaryQuery({ meterSerialNumber: undefined });
    case "missing_report_type":
      return primaryQuery({ "report-type": undefined });
    case "dev_live_ls":
    case "contract_live_ls":
    case "contract_live_dp":
    case "contract_live_ip":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveConsumerReportContractBody(
  scenario: ConsumerReportScenario,
): ConsumerReportResponse | undefined {
  switch (scenario) {
    case "contract_live_ls":
      return consumerReportContractLiveLsResponse;
    case "contract_live_dp":
      return consumerReportContractLiveDpResponse;
    case "contract_live_ip":
      return consumerReportContractLiveIpResponse;
    case "contract_empty_page":
      return consumerReportContractEmptyPageResponse;
    default:
      return undefined;
  }
}

export const consumerReportTestCases: ConsumerReportTestCase[] = [
  {
    testName: "Consumer report LS — first page shows columns and intervals",
    scenario: "dev_live_ls",
    tags: ["@smoke", "@reports", "@consumer-report"],
  },
  {
    testName: "Consumer report DP — first page shows columns and daily readings",
    scenario: "dev_live_dp",
    tags: ["@reports", "@consumer-report", "@matrix"],
  },
  {
    testName: "Consumer report IP — first page shows columns and instants",
    scenario: "dev_live_ip",
    tags: ["@reports", "@consumer-report", "@matrix"],
  },
  {
    testName: "Consumer report LS — without total still shows columns",
    scenario: "dev_live_ls_without_total",
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report LS — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report LS — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report LS — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report LS — Oct 2025 fixture",
    scenario: "contract_live_ls",
    isContractFixture: true,
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report DP — Oct 2025 fixture",
    scenario: "contract_live_dp",
    isContractFixture: true,
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report IP — Oct 2025 fixture",
    scenario: "contract_live_ip",
    isContractFixture: true,
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report — invalid report type still returns the LS grid",
    scenario: "invalid_report_type",
    tags: ["@reports", "@consumer-report", "@edge"],
  },
  {
    testName: "Consumer report — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@consumer-report", "@negative"],
  },
  {
    testName: "Consumer report — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@reports", "@consumer-report", "@negative"],
  },
  {
    testName: "Consumer report — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@consumer-report", "@negative"],
  },
  {
    testName: "Consumer report — missing meter serial is rejected",
    scenario: "missing_meter_serial",
    expectedStatus: 400,
    tags: ["@reports", "@consumer-report", "@negative"],
  },
  {
    testName: "Consumer report — missing report type still returns the LS grid",
    scenario: "missing_report_type",
    tags: ["@reports", "@consumer-report", "@edge"],
  },
];
