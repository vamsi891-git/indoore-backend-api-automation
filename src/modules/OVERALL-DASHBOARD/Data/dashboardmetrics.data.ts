import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type {
  DashboardMetricsResponse,
  OverallMetricsScenario,
} from "../Mapper/dashboardmetrics.mapper";

export const dashboardMetricsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const OVERALL_METRICS_PATH = "/indore/dashboard/overall-metrics";

/** KPI card keys always present on overall-metrics (live sample Aug 2026). */
export const OVERALL_METRICS_KPI_KEYS = [
  "billingAvailability",
  "billingEfficiency",
  "revenueGainedRpu",
  "totalImprovement",
  "avgImprovement",
  "subsidySave",
  "incentivePf",
  "penaltyPf",
  "expectedRoi",
  "loadEnhanced",
] as const;

export const OVERALL_METRICS_CHART_KEYS = [
  "lineChartData",
  "disconnectionData",
  "disconnectionSummary",
  "billingEfficiencyChart",
  "atrAmountChart",
  "defaultLineData",
] as const;

export const OVERALL_METRICS_DONUT_KEYS = [
  "billingEfficiencyDonut",
  "benefitsAtrCasesDonut",
] as const;

/** Contract fixture from live localhost response (13 Aug 2026). */
export const overallMetricsContractBody: DashboardMetricsResponse = {
  success: true,
  data: {
    billingAvailability: {
      value: "34,24,488 Meters · 16.00 Lac",
      footerDelta: 4,
      sparklineData: [12, 12, 16],
    },
    billingEfficiency: {
      value: "1,521.37 LU · 32.50 Lac",
      footerDelta: 14.5,
      sparklineData: [18, 18, 32.5],
    },
    revenueGainedRpu: {
      value: "Input 41,167.70 LU · RPU Rs 0.28 · Amt 40.00 Lac",
      footerDelta: 15,
      sparklineData: [25, 25, 40],
    },
    totalImprovement: {
      value: "1.13 Cr",
      footer: "Overall benefit (sum of amounts)",
      footerDelta: 0.4,
      sparklineData: [0.73, 0.73, 1.13],
    },
    avgImprovement: {
      value: "₹ 188.50 / month",
      footer: "Average improvement per bill",
      footerDelta: 26.28,
      sparklineData: [162.22, 162.22, 188.5],
    },
    subsidySave: {
      value: "13.00 Lac",
      footerDelta: 3,
      sparklineData: [10, 10, 13],
    },
    incentivePf: {
      value: "154631 No 9.00 Lac",
      footerDelta: 3,
      sparklineData: [6, 6, 9],
    },
    penaltyPf: {
      value: "73614 No 2.60 Lac",
      footerDelta: 0.6,
      sparklineData: [2, 2, 2.6],
    },
    expectedRoi: {
      value: "28 Months",
      footer: "From Date of Award",
      footerDelta: 0,
      sparklineData: [],
    },
    loadEnhanced: {
      value: "35.32 MW",
      footer: "Due to increase in Sanction Load",
      footerDelta: 0,
      sparklineData: [],
    },
    installationSummary: [
      { label: "Mapped Meters", value: 136235, percent: 99.954 },
      { label: "Unmapped Meters", value: 63, percent: 0.046 },
    ],
    lineChartData: { categories: [], series: [] },
    disconnectionData: {
      categories: ["Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"],
      series: [
        {
          name: "Disconnected Meters",
          data: [0, 0, 0, 0, 4511, 1],
        },
        {
          name: "Reconnected Meters",
          data: [0, 0, 0, 0, 117190, 15],
        },
      ],
    },
    disconnectionSummary: { categories: [], series: [] },
    billingEfficiencyChart: {
      categories: ["Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"],
      series: [
        {
          name: "Avg Billing after Smart meter",
          data: [0, 11.11, 0, 0, 0, 0],
        },
        { name: "Base Line", data: [0, 0, 0, 0, 0, 0] },
        {
          name: "Inc in Billing Efficiency",
          data: [0, 11.11, 0, 0, 0, 0],
        },
      ],
    },
    billingEfficiencyDonut: [
      { label: "Base Line", value: 0, percent: 0 },
      { label: "Avg Billing after Smart meter", value: 0, percent: 0 },
      { label: "Inc in Billing Efficiency", value: 0, percent: 0 },
    ],
    benefitsAtrCasesDonut: [
      { label: "MD > SL (penalty)", value: 0, percent: 0 },
      { label: "Increase SL", value: 0, percent: 0 },
      { label: "Aberation cases", value: 0, percent: 0 },
      { label: "DL to NDL/IP", value: 0, percent: 0 },
    ],
    atrAmountChart: { categories: [], series: [] },
    defaultLineData: { categories: [], series: [] },
  },
};

export interface OverallMetricsTestCase {
  testName: string;
  scenario: OverallMetricsScenario;
  tags: string[];
  isContractFixture?: boolean;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const dashboardMetricsTestCases: OverallMetricsTestCase[] = [
  {
    testName: "Home dashboard — cards, charts, and mapped vs unmapped meters load",
    scenario: "success",
    tags: ["@smoke", "@overall-dashboard", "@overall-metrics"],
    nonEmptyExpected: true,
  },
  {
    testName: "Home dashboard — the main number cards look complete",
    scenario: "kpi-cards",
    tags: ["@regression", "@overall-dashboard", "@overall-metrics"],
    nonEmptyExpected: false,
  },
  {
    testName: "Home dashboard — mapped vs unmapped meter shares add up",
    scenario: "installation-summary",
    tags: ["@regression", "@overall-dashboard", "@overall-metrics"],
    nonEmptyExpected: false,
  },
  {
    testName: "Home dashboard — charts and pie charts load",
    scenario: "charts-and-donuts",
    tags: ["@regression", "@overall-dashboard", "@overall-metrics"],
    nonEmptyExpected: false,
  },
  {
    testName: "Home dashboard — saved example still matches (offline)",
    scenario: "success",
    tags: ["@contract", "@overall-dashboard", "@overall-metrics"],
    nonEmptyExpected: false,
    isContractFixture: true,
  },
];

export function resolveOverallMetricsContractBody(
  scenario: OverallMetricsScenario,
): DashboardMetricsResponse | null {
  void scenario;
  return overallMetricsContractBody;
}
