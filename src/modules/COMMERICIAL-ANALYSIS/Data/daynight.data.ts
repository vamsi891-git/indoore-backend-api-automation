import { commercialAnalysisWindow } from "./commercial-window.data";

export type DayNightType =
  | "Night Zero Consumption"
  | "Night consumption <= 10% of Day consumption";

export type DayNightKind = "zero" | "lte_threshold";

export const DAY_NIGHT_TYPES: DayNightType[] = [
  "Night Zero Consumption",
  "Night consumption <= 10% of Day consumption",
];

export const DAY_NIGHT_TYPE_CONFIG: Record<
  DayNightType,
  { kind: DayNightKind }
> = {
  "Night Zero Consumption": { kind: "zero" },
  "Night consumption <= 10% of Day consumption": { kind: "lte_threshold" },
};

/** Identity columns — live grid has no subStation. */
export const DAY_NIGHT_IDENTITY_COLUMN_KEYS = [
  "circle",
  "division",
  "subDivision",
  "feeder",
  "dtr",
  "name",
  "ivrsNumber",
  "tariff",
  "msn",
  "phase",
] as const;

export const DAY_NIGHT_ZERO_GRID_COLUMN_KEYS = [
  ...DAY_NIGHT_IDENTITY_COLUMN_KEYS,
  "count",
  "dayKwh",
] as const;

export const DAY_NIGHT_LTE_GRID_COLUMN_KEYS = [
  ...DAY_NIGHT_IDENTITY_COLUMN_KEYS,
  "nightKwh",
  "dayKwh",
] as const;

export const NIGHT_LTE_THRESHOLD_RATIO = 0.1;

export function dayNightGridColumnKeys(
  type: DayNightType,
): readonly string[] {
  return DAY_NIGHT_TYPE_CONFIG[type].kind === "zero"
    ? DAY_NIGHT_ZERO_GRID_COLUMN_KEYS
    : DAY_NIGHT_LTE_GRID_COLUMN_KEYS;
}

/**
 * Oct 2025: both types return live totals (summary 1130 / 2332).
 * Always send connectionCategory=domestic — unfiltered commercial queries time out.
 * connectionCategory is stripped (domestic === non-domestic === summary.totalCount).
 *
 * This report has no duplicate records. Default tests still check
 * meterLookupId uniqueness and same-MSN same-metric on pages fetched only.
 */
export const dayNightCountBase = {
  ...commercialAnalysisWindow,
  connectionCategory: "domestic" as const,
  page: 1,
  pageSize: 10,
} as const;

export const dayNightValidatableQueries = DAY_NIGHT_TYPES.map((type) => ({
  ...dayNightCountBase,
  type,
}));

export const dayNightZeroData = {
  ...dayNightCountBase,
  type: "Night Zero Consumption" as const,
};

export const dayNightLteData = {
  ...dayNightCountBase,
  type: "Night consumption <= 10% of Day consumption" as const,
};
