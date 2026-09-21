import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrDataQuery as DtrDataApiQuery } from "../Api/dtrdata.api";
import type {
  DtrDataColumn,
  DtrDataReportType,
  DtrDataResponse,
  DtrDataScenario,
} from "../Mapper/dtrdata.mapper";

export type DtrDataQuery = DtrDataApiQuery & {
  foo?: string;
  unused?: number;
};

export const dtrDataMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — IP, 1–30 Oct 2025, includeTotal=false. */
export const dtrDataDefaultFromDate = "2025-10-01";
export const dtrDataDefaultToDate = "2025-10-30";
export const dtrDataDefaultPage = 1;
export const dtrDataDefaultLimit = 10;
export const dtrDataBeyondPage = 99;
export const dtrDataDefaultReportType: DtrDataReportType = "ip";
/** DP interactive window must be ≤ 7 days. */
export const dtrDataDpWeekFromDate = "2025-10-24";
export const dtrDataDpWeekToDate = "2025-10-30";

export const dtrDataSharedColumns: DtrDataColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "meterTime", header: "Meter Time" },
  { key: "mf", header: "MF" },
];

export const dtrDataIpMetricColumns: DtrDataColumn[] = [
  { key: "vlR", header: "VL R" },
  { key: "vlY", header: "VL Y" },
  { key: "vlB", header: "VL B" },
  { key: "ir", header: "IR" },
  { key: "iy", header: "IY" },
  { key: "ib", header: "IB" },
  { key: "rPf", header: "R PF" },
  { key: "yPf", header: "Y PF" },
  { key: "bPf", header: "B PF" },
  { key: "avgPf", header: "Avg PF" },
  { key: "kW", header: "kW" },
  { key: "kWh", header: "kWh" },
  { key: "kVA", header: "kVA" },
  { key: "kVAh", header: "kVAh" },
  { key: "kVAR", header: "kVAR" },
  { key: "freq", header: "Frequency" },
];

export const dtrDataLsMetricColumns: DtrDataColumn[] = [
  { key: "ir", header: "IR" },
  { key: "iy", header: "IY" },
  { key: "ib", header: "IB" },
  { key: "vlR", header: "VL R" },
  { key: "vlY", header: "VL Y" },
  { key: "vlB", header: "VL B" },
  { key: "kWh", header: "kWh" },
  { key: "kWhExp", header: "kWh Export" },
  { key: "kVAh", header: "kVAh" },
  { key: "kVAhExp", header: "kVAh Export" },
];

export const dtrDataDpMetricColumns: DtrDataColumn[] = [
  { key: "kWhImp", header: "kWh Import" },
  { key: "kWhExp", header: "kWh Export" },
  { key: "kVAhImp", header: "kVAh Import" },
  { key: "kVAhExp", header: "kVAh Export" },
];

export function dtrDataExpectedColumns(
  reportType: DtrDataReportType,
): DtrDataColumn[] {
  const metrics =
    reportType === "ip"
      ? dtrDataIpMetricColumns
      : reportType === "ls"
        ? dtrDataLsMetricColumns
        : dtrDataDpMetricColumns;
  return [...dtrDataSharedColumns, ...metrics];
}

function primaryQuery(overrides: Partial<DtrDataQuery> = {}): DtrDataQuery {
  return {
    fromDate: dtrDataDefaultFromDate,
    toDate: dtrDataDefaultToDate,
    reportType: dtrDataDefaultReportType,
    page: dtrDataDefaultPage,
    limit: dtrDataDefaultLimit,
    includeTotal: false,
    ...overrides,
  };
}

/** Live IP sample: 1–30 Oct 2025, includeTotal=false (first 2 rows). */
export const dtrDataContractLiveIpResponse: DtrDataResponse = {
  success: true,
  data: {
    columns: dtrDataExpectedColumns("ip"),
    rows: [
      {
        id: "row-1-19271025-78645",
        slNo: 1,
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "Hawabangla",
        subStation: "PragatiNagar",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ668",
        meterSerialNumber: "19271025",
        meterTime: "01-10-2025 00:00",
        mf: "40",
        meterLookupId: 78645,
        dataSource: "TP",
        vlR: "249.730",
        vlY: "248.780",
        vlB: "249.600",
        ir: "30.360",
        iy: "21.240",
        ib: "26.880",
        rPf: "-0.996",
        yPf: "-0.985",
        bPf: "-0.995",
        avgPf: "-0.993",
        kW: "19.280",
        kWh: "1002134.400",
        kVA: "19.400",
        kVAh: "1003412.800",
        kVAR: "-2.200",
        freq: "50.020",
      },
      {
        id: "row-2-19271098-82593",
        slNo: 2,
        circle: "Indore city circle",
        division: "EAST",
        zone: "KHAZRANA",
        subStation: "KHAJRANA",
        feeder: "KHAJRANA DARGHA(CHQ)",
        dtr: "IK577",
        meterSerialNumber: "19271098",
        meterTime: "01-10-2025 00:00",
        mf: "60",
        meterLookupId: 82593,
        dataSource: "TP",
        vlR: "265.760",
        vlY: "268.070",
        vlB: "265.810",
        ir: "26.940",
        iy: "30.960",
        ib: "23.760",
        rPf: "0.967",
        yPf: "0.981",
        bPf: "0.919",
        avgPf: "0.962",
        kW: "20.880",
        kWh: "1021596.000",
        kVA: "21.660",
        kVAh: "1055421.000",
        kVAR: "5.880",
        freq: "50.020",
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

/** Live LS sample: 1–30 Oct 2025 (first 2 rows). Same meterTime, different meters. */
export const dtrDataContractLiveLsResponse: DtrDataResponse = {
  success: true,
  data: {
    columns: dtrDataExpectedColumns("ls"),
    rows: [
      {
        id: "row-1-19271370-3231",
        slNo: 1,
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "Hawabangla",
        subStation: "PragatiNagar",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ6612",
        meterSerialNumber: "19271370",
        meterTime: "01-10-2025 00:00",
        mf: "1",
        meterLookupId: 3231,
        dataSource: "TP",
        ir: "0.496",
        iy: "0.278",
        ib: "0.556",
        vlR: "0.000",
        vlY: "248.950",
        vlB: "247.680",
        kWh: "0.052",
        kWhExp: "0.000",
        kVAh: "0.052",
        kVAhExp: "0.000",
      },
      {
        id: "row-2-19270978-74639",
        slNo: 2,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "MP Nagar",
        feeder: "MENTAL HOSPITAL(CHQ)",
        dtr: "WI661",
        meterSerialNumber: "19270978",
        meterTime: "01-10-2025 00:00",
        mf: "60",
        meterLookupId: 74639,
        dataSource: "TP",
        ir: "52.440",
        iy: "46.800",
        ib: "74.760",
        vlR: "257.260",
        vlY: "216.680",
        vlB: "252.240",
        kWh: "10.525",
        kWhExp: "0.000",
        kVAh: "10.527",
        kVAhExp: "0.000",
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

export const dtrDataContractEmptyPageResponse: DtrDataResponse = {
  success: true,
  data: {
    columns: dtrDataExpectedColumns("ip"),
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

export interface DtrDataTestCase {
  testName: string;
  scenario: DtrDataScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
  expectedErrorCode?: string;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDtrDataQuery(scenario: DtrDataScenario): DtrDataQuery {
  switch (scenario) {
    case "dev_live_ls":
    case "contract_live_ls":
      return primaryQuery({ reportType: "ls" });
    case "dev_live_dp_week":
      return primaryQuery({
        reportType: "dp",
        fromDate: dtrDataDpWeekFromDate,
        toDate: dtrDataDpWeekToDate,
      });
    case "dev_dp_range_too_long":
      return primaryQuery({ reportType: "dp" });
    case "dev_live_include_total":
      return primaryQuery({ includeTotal: true });
    case "dev_live_page_beyond":
      return primaryQuery({ page: dtrDataBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_report_type":
      return primaryQuery({ reportType: "xyz" });
    case "invalid_date_range":
      return primaryQuery({
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "missing_from_date":
      return primaryQuery({ fromDate: undefined });
    case "missing_to_date":
      return primaryQuery({ toDate: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "dev_live_primary":
    case "contract_live_ip":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveDtrDataContractBody(
  scenario: DtrDataScenario,
): DtrDataResponse | undefined {
  switch (scenario) {
    case "contract_live_ip":
      return dtrDataContractLiveIpResponse;
    case "contract_live_ls":
      return dtrDataContractLiveLsResponse;
    case "contract_empty_page":
      return dtrDataContractEmptyPageResponse;
    default:
      return undefined;
  }
}

export const dtrDataTestCases: DtrDataTestCase[] = [
  {
    testName: "DTR data — Oct 2025 IP first page shows columns and readings",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@reports", "@dtr-data"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR data — Oct 2025 LS first page shows columns and readings",
    scenario: "dev_live_ls",
    tags: ["@reports", "@dtr-data", "@matrix"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — DP in a 7-day window returns the grid",
    scenario: "dev_live_dp_week",
    tags: ["@reports", "@dtr-data", "@matrix"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — includeTotal still shows the same IP columns",
    scenario: "dev_live_include_total",
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — a far page still returns a valid table",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — IP fixture (1–30 Oct 2025)",
    scenario: "contract_live_ip",
    isContractFixture: true,
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — LS fixture (1–30 Oct 2025)",
    scenario: "contract_live_ls",
    isContractFixture: true,
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@dtr-data", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "DTR data — DP over 30 days requires background export",
    scenario: "dev_dp_range_too_long",
    expectedStatus: 400,
    expectedErrorCode: "REPORT_BACKGROUND_REQUIRED",
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — invalid report type is rejected",
    scenario: "invalid_report_type",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR data — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-data", "@negative"],
    nonEmptyExpected: false,
  },
];
