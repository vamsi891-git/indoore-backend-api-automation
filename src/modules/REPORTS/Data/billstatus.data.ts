import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { BillStatusQuery as BillStatusApiQuery } from "../Api/billstatus.api";
import type {
  BillStatusColumn,
  BillStatusResponse,
  BillStatusScenario,
} from "../Mapper/billstatus.mapper";

export type BillStatusQuery = BillStatusApiQuery & {
  foo?: string;
  unused?: number;
};

export const billStatusMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — GET /reports/bill-status?month=10&year=2025&includeTotal=true */
export const billStatusDefaultMonth = 10;
export const billStatusDefaultYear = 2025;
export const billStatusDefaultPage = 1;
export const billStatusDefaultLimit = 10;
export const billStatusBeyondPage = 99;

export const billStatusExpectedColumns: BillStatusColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "totalConsumer", header: "Total Consumer" },
  { key: "billGenerated", header: "Bill Generated" },
  { key: "billNotGenerated", header: "Bill Not Generated" },
];

function primaryQuery(overrides: Partial<BillStatusQuery> = {}): BillStatusQuery {
  return {
    month: billStatusDefaultMonth,
    year: billStatusDefaultYear,
    page: billStatusDefaultPage,
    limit: billStatusDefaultLimit,
    includeTotal: true,
    ...overrides,
  };
}

/**
 * Live sample Oct 2025: empty grid rows, summary counts filled.
 * Empty rows ≠ “no bill status data” when summary has consumers.
 */
export const billStatusContractLiveOct2025Response: BillStatusResponse = {
  success: true,
  data: {
    columns: billStatusExpectedColumns,
    rows: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      totalIsExact: true,
      hasMore: false,
    },
    summary: {
      totalConsumers: 141059,
      billGenerated: 120010,
      billNotGenerated: 21049,
    },
  },
};

export const billStatusContractEmptySummaryZeroResponse: BillStatusResponse = {
  success: true,
  data: {
    columns: billStatusExpectedColumns,
    rows: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      totalIsExact: true,
      hasMore: false,
    },
    summary: {
      totalConsumers: 0,
      billGenerated: 0,
      billNotGenerated: 0,
    },
  },
};

export interface BillStatusTestCase {
  testName: string;
  scenario: BillStatusScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveBillStatusQuery(
  scenario: BillStatusScenario,
): BillStatusQuery {
  switch (scenario) {
    case "dev_live_without_total":
      return primaryQuery({ includeTotal: false });
    case "dev_live_page_beyond":
      return primaryQuery({ page: billStatusBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_month":
      return primaryQuery({ month: 13 });
    case "invalid_year":
      return primaryQuery({ year: 0 });
    case "missing_year":
      return primaryQuery({ year: undefined });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "dev_live_include_total":
    case "contract_live_oct_2025":
    case "contract_empty_summary_zero":
    default:
      return primaryQuery();
  }
}

export function resolveBillStatusContractBody(
  scenario: BillStatusScenario,
): BillStatusResponse | undefined {
  switch (scenario) {
    case "contract_live_oct_2025":
      return billStatusContractLiveOct2025Response;
    case "contract_empty_summary_zero":
      return billStatusContractEmptySummaryZeroResponse;
    default:
      return undefined;
  }
}

export const billStatusTestCases: BillStatusTestCase[] = [
  {
    testName: "Bill status — Oct 2025 summary (empty list is valid)",
    scenario: "dev_live_include_total",
    tags: ["@smoke", "@reports", "@bill-status"],
    nonEmptyExpected: true,
  },
  {
    testName: "Bill status — first page without a total still shows columns",
    scenario: "dev_live_without_total",
    tags: ["@reports", "@bill-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — showing 1 per page still returns the summary",
    scenario: "dev_limit_one",
    tags: ["@reports", "@bill-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — a far page still returns the summary",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@bill-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@bill-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — Oct 2025 fixture (summary with empty rows)",
    scenario: "contract_live_oct_2025",
    isContractFixture: true,
    tags: ["@reports", "@bill-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — zero summary fixture",
    scenario: "contract_empty_summary_zero",
    isContractFixture: true,
    tags: ["@reports", "@bill-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — invalid month is rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@reports", "@bill-status", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — invalid year is rejected",
    scenario: "invalid_year",
    expectedStatus: 400,
    tags: ["@reports", "@bill-status", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — missing year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@reports", "@bill-status", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@reports", "@bill-status", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@bill-status", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Bill status — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@bill-status", "@negative"],
    nonEmptyExpected: false,
  },
];
