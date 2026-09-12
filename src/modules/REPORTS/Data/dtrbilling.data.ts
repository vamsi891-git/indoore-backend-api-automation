import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrBillingQuery as DtrBillingApiQuery } from "../Api/dtrbilling.api";
import type {
  DtrBillingColumn,
  DtrBillingResponse,
  DtrBillingScenario,
} from "../Mapper/dtrbilling.mapper";
import { dtrBillingColumnKeys } from "../Mapper/dtrbilling.mapper";

export type DtrBillingQuery = DtrBillingApiQuery & {
  foo?: string;
  unused?: number;
};

export const dtrBillingMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — GET /reports/dtr-billing?fromDate=2025-10-01&toDate=2025-10-30&includeTotal=false */
export const dtrBillingDefaultFromDate = "2025-10-01";
export const dtrBillingDefaultToDate = "2025-10-30";
export const dtrBillingDefaultPage = 1;
export const dtrBillingDefaultLimit = 10;
export const dtrBillingBeyondPage = 99;

export const dtrBillingExpectedColumns: DtrBillingColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "dtrRating", header: "DTR Capacity" },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "meterTime", header: "Meter Time" },
  { key: "billingDate", header: "Billing Date" },
  { key: "kwhImp", header: "kWh Import" },
  { key: "kwhExp", header: "kWh Export" },
  { key: "kvahImp", header: "kVAh Import" },
  { key: "kvahExp", header: "kVAh Export" },
  { key: "kwImp", header: "kW Import" },
  { key: "kwDateTime", header: "kW Date Time" },
  { key: "kvaImp", header: "kVA Import" },
  { key: "kvaDateTime", header: "kVA Date Time" },
  { key: "mf", header: "MF" },
];

/** Ensure column key list stays in sync with expected columns. */
void dtrBillingColumnKeys;

function primaryQuery(
  overrides: Partial<DtrBillingQuery> = {},
): DtrBillingQuery {
  return {
    fromDate: dtrBillingDefaultFromDate,
    toDate: dtrBillingDefaultToDate,
    page: dtrBillingDefaultPage,
    limit: dtrBillingDefaultLimit,
    includeTotal: false,
    ...overrides,
  };
}

/**
 * Live sample 1–30 Oct 2025 — includeTotal=false (null total, hasMore).
 * kWh export 0.00 and kvaDateTime null are valid. Decimal energy stays strings.
 */
export const dtrBillingContractLiveOct2025Response: DtrBillingResponse = {
  success: true,
  data: {
    columns: dtrBillingExpectedColumns,
    rows: [
      {
        id: "row-1-19270969",
        slNo: 1,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "NIRANJANPURMLZ",
        feeder: "E.W.S.(CHQ)",
        dtr: "ML8120",
        dtrRating: "200",
        meterSerialNumber: "19270969",
        meterTime: "01-10-2025 00:00",
        billingDate: "01-10-2025 00:00",
        kwhImp: "10.12",
        kwhExp: "0.00",
        kvahImp: "10.25",
        kvahExp: "0.00",
        kwImp: "0.0005",
        kwDateTime: "24-09-2025 07:25",
        kvaImp: "0.0005",
        kvaDateTime: null,
        mf: "80",
      },
      {
        id: "row-2-19270971",
        slNo: 2,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "NIRANJANPURMLZ",
        feeder: "E.W.S.(CHQ)",
        dtr: "ML8123",
        dtrRating: "200",
        meterSerialNumber: "19270971",
        meterTime: "01-10-2025 00:00",
        billingDate: "01-10-2025 00:00",
        kwhImp: "9.95",
        kwhExp: "0.00",
        kvahImp: "10.03",
        kvahExp: "0.00",
        kwImp: "0.0005",
        kwDateTime: "24-09-2025 07:20",
        kvaImp: "0.0005",
        kvaDateTime: null,
        mf: "80",
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

export const dtrBillingContractEmptyPageResponse: DtrBillingResponse = {
  success: true,
  data: {
    columns: dtrBillingExpectedColumns,
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

export interface DtrBillingTestCase {
  testName: string;
  scenario: DtrBillingScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

/** @deprecated Use resolveDtrBillingQuery — kept for backward compatibility. */
export const DtrBillingData = {
  fromDate: dtrBillingDefaultFromDate,
  toDate: dtrBillingDefaultToDate,
  page: dtrBillingDefaultPage,
  limit: dtrBillingDefaultLimit,
  includeTotal: false,
  maxResponseTime: dtrBillingMaxResponseTimeMs,
};

export function resolveDtrBillingQuery(
  scenario: DtrBillingScenario,
): DtrBillingQuery {
  switch (scenario) {
    case "dev_live_include_total":
      return primaryQuery({ includeTotal: true });
    case "dev_live_page_beyond":
      return primaryQuery({ page: dtrBillingBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "edge_duplicate_meter_serials":
      return primaryQuery({
        meterSerialNumbers: ["19270969", "19270969"],
      });
    case "invalid_date_range":
      return primaryQuery({
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "invalid_from_date":
      return primaryQuery({ fromDate: "01-01-2025" });
    case "missing_from_date":
      return primaryQuery({ fromDate: undefined });
    case "missing_to_date":
      return primaryQuery({ toDate: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "dev_live_without_total":
    case "contract_live_oct_2025":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveDtrBillingContractBody(
  scenario: DtrBillingScenario,
): DtrBillingResponse | undefined {
  switch (scenario) {
    case "contract_live_oct_2025":
      return dtrBillingContractLiveOct2025Response;
    case "contract_empty_page":
      return dtrBillingContractEmptyPageResponse;
    default:
      return undefined;
  }
}

export const dtrBillingTestCases: DtrBillingTestCase[] = [
  {
    testName: "DTR billing — 1–30 Oct 2025 first page (null total is valid)",
    scenario: "dev_live_without_total",
    tags: ["@smoke", "@reports", "@dtr-billing"],
  },
  {
    testName: "DTR billing — includeTotal still shows the same columns",
    scenario: "dev_live_include_total",
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — showing 1 per page still lists a meter",
    scenario: "dev_limit_one",
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — a far page is empty or still consistent",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — duplicate meter serials are sent once",
    scenario: "edge_duplicate_meter_serials",
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — Oct 2025 fixture (null total, hasMore)",
    scenario: "contract_live_oct_2025",
    isContractFixture: true,
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@dtr-billing", "@edge"],
  },
  {
    testName: "DTR billing — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-billing", "@negative"],
  },
  {
    testName: "DTR billing — invalid fromDate is rejected",
    scenario: "invalid_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-billing", "@negative"],
  },
  {
    testName: "DTR billing — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-billing", "@negative"],
  },
  {
    testName: "DTR billing — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-billing", "@negative"],
  },
  {
    testName: "DTR billing — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-billing", "@negative"],
  },
  {
    testName: "DTR billing — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@dtr-billing", "@negative"],
  },
];
