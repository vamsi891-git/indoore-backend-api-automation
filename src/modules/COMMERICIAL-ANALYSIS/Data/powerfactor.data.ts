import { commercialAnalysisWindow } from "./commercial-window.data";

export type PfConnectionCategory = "domestic" | "non-domestic";

/** Live grid columns from GET /analysis/commercial/pf */
export const PF_GRID_COLUMN_KEYS = [
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
  "PF<.8",
  "PF",
] as const;

/**
 * Duplicate-MSN inventory: same meterLookupId/MSN on two DTRs is allowed
 * (page-1 example: 1204 / 14080783 on RJ6610 vs RJ6612). Same MSN+DTR+PF is a duplicate.
 */

export const pfAnalysisQuery = {
  ...commercialAnalysisWindow,
  threshold: 0.8,
  page: 1,
  pageSize: 10,
};

/** Shared month/year/threshold for category count checks (pageSize 10 matches UI). */
export const pfCategoryCountBase = {
  month: pfAnalysisQuery.month,
  year: pfAnalysisQuery.year,
  threshold: pfAnalysisQuery.threshold,
  page: 1,
  pageSize: 10,
} as const;

export const pfDomesticQuery = {
  ...pfCategoryCountBase,
  connectionCategory: "domestic" as const,
};

export const pfNonDomesticQuery = {
  ...pfCategoryCountBase,
  connectionCategory: "non-domestic" as const,
};

export const pfConnectionCategoryCases: Array<{
  label: string;
  connectionCategory: PfConnectionCategory;
  query: typeof pfDomesticQuery | typeof pfNonDomesticQuery;
}> = [
  {
    label: "domestic",
    connectionCategory: "domestic",
    query: pfDomesticQuery,
  },
  {
    label: "non-domestic",
    connectionCategory: "non-domestic",
    query: pfNonDomesticQuery,
  },
];
