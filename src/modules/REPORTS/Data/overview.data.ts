import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ReportsOverviewQuery as ReportsOverviewApiQuery } from "../Api/overview.api";
import type {
  ReportsOverviewKpi,
  ReportsOverviewResponse,
  ReportsOverviewScenario,
} from "../Mapper/overview.mapper";

export type ReportsOverviewQuery = ReportsOverviewApiQuery & {
  foo?: string;
  unused?: number;
};

export const reportsOverviewMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

const zeroKpi: ReportsOverviewKpi = {
  currentValue: 0,
  previousValue: 0,
  percentageChange: 0,
  trendDirection: "flat",
  comparisonAvailable: true,
  available: true,
};

/**
 * Live sample — GET /reports/overview.
 * All KPI cards at 0 with available=true is valid (not “no data”).
 * Periods are rolling (≈ last 30 days vs prior 30 days).
 */
export const reportsOverviewContractLiveZerosResponse: ReportsOverviewResponse =
  {
    success: true,
    data: {
      successful: { ...zeroKpi },
      scheduled: { ...zeroKpi },
      downloads: { ...zeroKpi },
      failed: { ...zeroKpi },
      currentPeriod: {
        from: "2026-07-15T09:12:42.591Z",
        to: "2026-08-14T09:12:42.591Z",
      },
      comparisonPeriod: {
        from: "2026-06-15T09:12:42.591Z",
        to: "2026-07-15T09:12:42.591Z",
      },
    },
  };

/** Fixture for trend math when values are non-zero. */
export const reportsOverviewContractNonzeroTrendsResponse: ReportsOverviewResponse =
  {
    success: true,
    data: {
      successful: {
        currentValue: 12,
        previousValue: 8,
        percentageChange: 50,
        trendDirection: "up",
        comparisonAvailable: true,
        available: true,
      },
      scheduled: {
        currentValue: 3,
        previousValue: 6,
        percentageChange: -50,
        trendDirection: "down",
        comparisonAvailable: true,
        available: true,
      },
      downloads: { ...zeroKpi },
      failed: {
        currentValue: 1,
        previousValue: 1,
        percentageChange: 0,
        trendDirection: "flat",
        comparisonAvailable: true,
        available: true,
      },
      currentPeriod: {
        from: "2026-07-15T09:12:42.591Z",
        to: "2026-08-14T09:12:42.591Z",
      },
      comparisonPeriod: {
        from: "2026-06-15T09:12:42.591Z",
        to: "2026-07-15T09:12:42.591Z",
      },
    },
  };

export interface ReportsOverviewTestCase {
  testName: string;
  scenario: ReportsOverviewScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveReportsOverviewQuery(
  scenario: ReportsOverviewScenario,
): ReportsOverviewQuery {
  switch (scenario) {
    case "dev_ignore_unknown_query":
      return { foo: "bar", unused: 1 };
    case "dev_live":
    case "contract_live_zeros":
    case "contract_nonzero_trends":
    default:
      return {};
  }
}

export function resolveReportsOverviewContractBody(
  scenario: ReportsOverviewScenario,
): ReportsOverviewResponse | undefined {
  switch (scenario) {
    case "contract_live_zeros":
      return reportsOverviewContractLiveZerosResponse;
    case "contract_nonzero_trends":
      return reportsOverviewContractNonzeroTrendsResponse;
    default:
      return undefined;
  }
}

export const reportsOverviewTestCases: ReportsOverviewTestCase[] = [
  {
    testName: "Overview — KPI cards show (zeros still count as available)",
    scenario: "dev_live",
    tags: ["@smoke", "@reports", "@overview"],
    nonEmptyExpected: true,
  },
  {
    testName: "Overview — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@overview", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Overview — zero KPI fixture",
    scenario: "contract_live_zeros",
    isContractFixture: true,
    tags: ["@reports", "@overview", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Overview — trend math fixture",
    scenario: "contract_nonzero_trends",
    isContractFixture: true,
    tags: ["@reports", "@overview", "@edge"],
    nonEmptyExpected: false,
  },
];
