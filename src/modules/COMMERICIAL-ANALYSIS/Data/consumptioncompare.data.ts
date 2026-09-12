import { commercialAnalysisWindow } from "./commercial-window.data";

/** API enum values for `type` query param */
export type ConsumptionCompareType =
  | "Consumption Compare Last Month"
  | "Consumption Compare Same Month Last Year"
  | "Abnormal High"
  | "Abnormal Low";

export const CONSUMPTION_COMPARE_TYPES: ConsumptionCompareType[] = [
  "Consumption Compare Last Month",
  "Consumption Compare Same Month Last Year",
  "Abnormal High",
  "Abnormal Low",
];

/** Oct 2025: only Last Month has billing snapshots. */
export const CONSUMPTION_COMPARE_COVERAGE_GATED_TYPES = [
  "Consumption Compare Same Month Last Year",
  "Abnormal High",
  "Abnormal Low",
] as const satisfies readonly ConsumptionCompareType[];

export type ConsumptionCompareCoverageGatedType =
  (typeof CONSUMPTION_COMPARE_COVERAGE_GATED_TYPES)[number];

export const CONSUMPTION_COMPARE_COVERAGE_GATED_MISSING_MONTHS: Record<
  ConsumptionCompareCoverageGatedType,
  readonly string[]
> = {
  "Consumption Compare Same Month Last Year": ["2024-09-01", "2024-10-01"],
  "Abnormal High": [
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
    "2025-06-01",
  ],
  "Abnormal Low": [
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
    "2025-06-01",
  ],
};

export const CONSUMPTION_COMPARE_COVERAGE_GATED_REASONS: Record<
  ConsumptionCompareCoverageGatedType,
  string
> = {
  "Consumption Compare Same Month Last Year":
    "BILLING_PERIOD_NOT_READY (missing 2024-09-01, 2024-10-01)",
  "Abnormal High":
    "BILLING_PERIOD_NOT_READY (missing 2025-03-01, 2025-04-01, 2025-05-01, 2025-06-01)",
  "Abnormal Low":
    "BILLING_PERIOD_NOT_READY (missing 2025-03-01, 2025-04-01, 2025-05-01, 2025-06-01)",
};

/** Live grid from GET /analysis/commercial/consumption-compare?type=Consumption Compare Last Month */
export const COMPARE_LAST_MONTH_GRID_COLUMN_KEYS = [
  "circle",
  "division",
  "subDivision",
  "subStation",
  "feeder",
  "dtr",
  "name",
  "ivrsNumber",
  "tariff",
  "msn",
  "phase",
  "currKwh",
  "prevKwh",
] as const;

export const consumptionCompareLastMonthData = {
  ...commercialAnalysisWindow,
  type: "Consumption Compare Last Month" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

/**
 * Full-grid uniqueness is meter + DTR + New/Old kWh.
 */

export const consumptionCompareSameMonthLastYearData = {
  ...commercialAnalysisWindow,
  type: "Consumption Compare Same Month Last Year" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareAbnormalHighData = {
  ...commercialAnalysisWindow,
  type: "Abnormal High" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareAbnormalLowData = {
  ...commercialAnalysisWindow,
  type: "Abnormal Low" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;
