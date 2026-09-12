import { commercialAnalysisWindow } from "./commercial-window.data";

export type ConsumptionPatternUiType =
  | "Zero Consumption"
  | "Zero Consumption for Last 3 months"
  | "Zero Consumption for Last 6 months"
  | "Zero Consumption for Last 9 months"
  | "Zero Consumption for Last 12 months"
  | "Zero Consumption More than 12 months"
  | "100 unit kwh from Last Three months continuous"
  | "100 unit kwh from Last Six months continuous"
  | "100 unit kwh from Last Nine months continuous"
  | "LAST SIX MONTH 50 % AVG CONSUMPTION < Initial Consumption";

export type ConsumptionPatternKind = "zero" | "low" | "avg_less_than_initial";
export type ConsumptionPatternCategory = "domestic" | "non-domestic";

export const CONSUMPTION_PATTERN_TYPES: ConsumptionPatternUiType[] = [
  "Zero Consumption",
  "Zero Consumption for Last 3 months",
  "Zero Consumption for Last 6 months",
  "Zero Consumption for Last 9 months",
  "Zero Consumption for Last 12 months",
  "Zero Consumption More than 12 months",
  "100 unit kwh from Last Three months continuous",
  "100 unit kwh from Last Six months continuous",
  "100 unit kwh from Last Nine months continuous",
  "LAST SIX MONTH 50 % AVG CONSUMPTION < Initial Consumption",
];

/**
 * Oct 2025: only 1m / 3m zero and 100-unit 3m return 200.
 * Unfiltered (no connectionCategory) times out — always send domestic.
 * connectionCategory is stripped (domestic === non-domestic).
 */
export const CONSUMPTION_PATTERN_VALIDATABLE_TYPES = [
  "Zero Consumption",
  "Zero Consumption for Last 3 months",
  "100 unit kwh from Last Three months continuous",
] as const satisfies readonly ConsumptionPatternUiType[];

export type ConsumptionPatternValidatableType =
  (typeof CONSUMPTION_PATTERN_VALIDATABLE_TYPES)[number];

/** Live SQL strips connectionCategory for every validatable pattern type. */
export const PATTERN_CONNECTION_CATEGORY_CASES: ConsumptionPatternCategory[] = [
  "domestic",
  "non-domestic",
];

export const CONSUMPTION_PATTERN_TYPE_CONFIG: Record<
  ConsumptionPatternUiType,
  { kind: ConsumptionPatternKind; months: number; threshold: number }
> = {
  "Zero Consumption": { kind: "zero", months: 1, threshold: 100 },
  "Zero Consumption for Last 3 months": { kind: "zero", months: 3, threshold: 100 },
  "Zero Consumption for Last 6 months": { kind: "zero", months: 6, threshold: 100 },
  "Zero Consumption for Last 9 months": { kind: "zero", months: 9, threshold: 100 },
  "Zero Consumption for Last 12 months": { kind: "zero", months: 12, threshold: 100 },
  "Zero Consumption More than 12 months": { kind: "zero", months: 13, threshold: 100 },
  "100 unit kwh from Last Three months continuous": {
    kind: "low",
    months: 3,
    threshold: 100,
  },
  "100 unit kwh from Last Six months continuous": {
    kind: "low",
    months: 6,
    threshold: 100,
  },
  "100 unit kwh from Last Nine months continuous": {
    kind: "low",
    months: 9,
    threshold: 100,
  },
  "LAST SIX MONTH 50 % AVG CONSUMPTION < Initial Consumption": {
    kind: "avg_less_than_initial",
    months: 6,
    threshold: 100,
  },
};

export const PATTERN_GRID_COLUMN_KEYS = [
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
  "kWh",
] as const;

export const CONSUMPTION_PATTERN_COVERAGE_GATED_TYPES = [
  "Zero Consumption for Last 6 months",
  "Zero Consumption for Last 9 months",
  "Zero Consumption for Last 12 months",
  "Zero Consumption More than 12 months",
  "100 unit kwh from Last Six months continuous",
  "100 unit kwh from Last Nine months continuous",
] as const satisfies readonly ConsumptionPatternUiType[];

/** Backend maps this pattern to INTERNAL_ERROR (500) when billing months are missing. */
export const CONSUMPTION_PATTERN_AVG_INITIAL_TYPE =
  "LAST SIX MONTH 50 % AVG CONSUMPTION < Initial Consumption" as const;

export type ConsumptionPatternCoverageGatedType =
  (typeof CONSUMPTION_PATTERN_COVERAGE_GATED_TYPES)[number];

export const CONSUMPTION_PATTERN_COVERAGE_GATED_MISSING_MONTHS: Record<
  ConsumptionPatternCoverageGatedType,
  readonly string[]
> = {
  "Zero Consumption for Last 6 months": ["2025-04-01", "2025-05-01"],
  "Zero Consumption for Last 9 months": [
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
  ],
  "Zero Consumption for Last 12 months": [
    "2024-10-01",
    "2024-11-01",
    "2024-12-01",
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
  ],
  "Zero Consumption More than 12 months": [
    "2024-09-01",
    "2024-10-01",
    "2024-11-01",
    "2024-12-01",
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
  ],
  "100 unit kwh from Last Six months continuous": [
    "2025-04-01",
    "2025-05-01",
  ],
  "100 unit kwh from Last Nine months continuous": [
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
    "2025-04-01",
    "2025-05-01",
  ],
};

export const CONSUMPTION_PATTERN_COVERAGE_GATED_REASONS = {
  "Zero Consumption for Last 6 months":
    "BILLING_PERIOD_NOT_READY (zeroMonths=6, missing 2025-04-01, 2025-05-01)",
  "Zero Consumption for Last 9 months":
    "BILLING_PERIOD_NOT_READY (zeroMonths=9, missing 2025-01 through 2025-05)",
  "Zero Consumption for Last 12 months":
    "BILLING_PERIOD_NOT_READY (zeroMonths=12, missing 2024-10 through 2025-05)",
  "Zero Consumption More than 12 months":
    "BILLING_PERIOD_NOT_READY (zeroMonths=13, missing 2024-09 through 2025-05)",
  "100 unit kwh from Last Six months continuous":
    "BILLING_PERIOD_NOT_READY (consumptionMonthCount=6, missing 2025-04-01, 2025-05-01)",
  "100 unit kwh from Last Nine months continuous":
    "BILLING_PERIOD_NOT_READY (consumptionMonthCount=9, missing 2025-01 through 2025-05)",
  "LAST SIX MONTH 50 % AVG CONSUMPTION < Initial Consumption":
    "BILLING_PERIOD_NOT_READY or uncovered 6m window (send connectionCategory=domestic)",
} as const;

export const consumptionPatternCountBase = {
  ...commercialAnalysisWindow,
  connectionCategory: "domestic" as const,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionPatternValidatableQueries =
  CONSUMPTION_PATTERN_VALIDATABLE_TYPES.map((type) => ({
    ...consumptionPatternCountBase,
    type,
  }));

/** Smoke / auth / negative default — always include connectionCategory to avoid timeout. */
export const consumptionPatternData = {
  ...consumptionPatternCountBase,
  type: "Zero Consumption" as const,
  pattern: "zero" as const,
  months: 1,
  threshold: 100,
};

export const consumptionPatternZero3mData = {
  ...consumptionPatternCountBase,
  type: "Zero Consumption for Last 3 months" as const,
  pattern: "zero" as const,
  months: 3,
  threshold: 100,
};

export const consumptionPatternLow3mData = {
  ...consumptionPatternCountBase,
  type: "100 unit kwh from Last Three months continuous" as const,
  pattern: "low" as const,
  months: 3,
  threshold: 100,
};

export const consumptionPatternLow6mData = {
  ...consumptionPatternCountBase,
  type: "100 unit kwh from Last Six months continuous" as const,
  pattern: "low" as const,
  months: 6,
  threshold: 100,
};
