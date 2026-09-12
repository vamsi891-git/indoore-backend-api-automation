import { commercialAnalysisWindow } from "./commercial-window.data";

export type LfConnectionCategory = "domestic" | "non-domestic";

/** UI / backend `type` values — commercial.schemas LF_ANALYSIS_TYPES */
export const LF_ANALYSIS_TYPES = [
  "LF < 5%",
  "LF > 100%",
  "LF < 5% Last Three month",
  "LF < 5% Last Six Month",
] as const;

export type LfAnalysisType = (typeof LF_ANALYSIS_TYPES)[number];

/** Oct 2025: last-6m window is missing 2025-04 and 2025-05. */
export const LF_COVERAGE_GATED_TYPE: LfAnalysisType = "LF < 5% Last Six Month";

export const LF_COVERAGE_GATED_MISSING_MONTHS = [
  "2025-04-01",
  "2025-05-01",
] as const;

export const LF_VALIDATABLE_TYPES: LfAnalysisType[] = LF_ANALYSIS_TYPES.filter(
  (type) => type !== LF_COVERAGE_GATED_TYPE,
);

export const LF_TYPE_CONFIG: Record<
  LfAnalysisType,
  {
    threshold: number;
    operator: "lt" | "gt";
    months: number;
    extraColumnKey: "LF<5%" | "LF>100%";
    /** Live LF<5% column is the threshold echo. LF>100% is sanctioned load, not 100. */
    echoesThreshold: boolean;
  }
> = {
  "LF < 5%": {
    threshold: 5,
    operator: "lt",
    months: 1,
    extraColumnKey: "LF<5%",
    echoesThreshold: true,
  },
  "LF > 100%": {
    threshold: 100,
    operator: "gt",
    months: 1,
    extraColumnKey: "LF>100%",
    echoesThreshold: false,
  },
  "LF < 5% Last Three month": {
    threshold: 5,
    operator: "lt",
    months: 3,
    extraColumnKey: "LF<5%",
    echoesThreshold: true,
  },
  "LF < 5% Last Six Month": {
    threshold: 5,
    operator: "lt",
    months: 6,
    extraColumnKey: "LF<5%",
    echoesThreshold: true,
  },
};

const LF_SHARED_GRID_COLUMN_KEYS = [
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
] as const;

/** Live grid columns from GET /analysis/commercial/lf?type=LF < 5% (and last 3m). */
export const LF_LT5_GRID_COLUMN_KEYS = [
  ...LF_SHARED_GRID_COLUMN_KEYS,
  "LF<5%",
  "LF",
] as const;

/** Live grid columns from GET /analysis/commercial/lf?type=LF > 100%. */
export const LF_GT100_GRID_COLUMN_KEYS = [
  ...LF_SHARED_GRID_COLUMN_KEYS,
  "LF>100%",
  "LF",
] as const;

export function lfGridColumnKeys(type: LfAnalysisType): readonly string[] {
  return LF_TYPE_CONFIG[type].extraColumnKey === "LF>100%"
    ? LF_GT100_GRID_COLUMN_KEYS
    : LF_LT5_GRID_COLUMN_KEYS;
}

export const lfAnalysisData = {
  ...commercialAnalysisWindow,
  type: "LF < 5%" as const,
  /** Legacy aliases — backend uses `type`; kept for edge/auth fixtures */
  threshold: 5,
  operator: "lt" as const,
  months: 1,
  page: 1,
  pageSize: 10,
};

export const lfValidatableQueries = LF_VALIDATABLE_TYPES.map((type) => ({
  ...commercialAnalysisWindow,
  type,
  page: 1,
  pageSize: 10,
}));

/**
 * Full-grid uniqueness is meter + DTR + LF. Same MSN on two DTRs is allowed.
 */

/** Live LF SQL strips connectionCategory — still hit both query params. */
export const LF_CONNECTION_CATEGORY_CASES: LfConnectionCategory[] = [
  "domestic",
  "non-domestic",
];

export const lfCategoryPageQueries = LF_VALIDATABLE_TYPES.flatMap((type) =>
  LF_CONNECTION_CATEGORY_CASES.map((connectionCategory) => ({
    ...commercialAnalysisWindow,
    type,
    page: 1,
    pageSize: 10,
    connectionCategory,
  })),
);

/** Backward-compatible aliases used by edge/auth fixtures */
export const lfAnalysisGt100Data = {
  ...commercialAnalysisWindow,
  type: "LF > 100%" as const,
  page: 1,
  pageSize: 10,
};

export const lfAnalysisLt5Last3mData = {
  ...commercialAnalysisWindow,
  type: "LF < 5% Last Three month" as const,
  page: 1,
  pageSize: 10,
};

export const lfAnalysisLt5Last6mData = {
  ...commercialAnalysisWindow,
  type: "LF < 5% Last Six Month" as const,
  page: 1,
  pageSize: 10,
};
