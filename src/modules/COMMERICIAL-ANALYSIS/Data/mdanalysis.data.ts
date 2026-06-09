/** API enum values for `type` query param */
export type MdAnalysisType =
  | "MD > CD Last Three Month"
  | "Sanction Load Violation"
  | "Improper MD";

export const mdAnalysisCdCompareData = {
  month: 12,
  year: 2025,
  type: "MD > CD Last Three Month" as MdAnalysisType,
  months: 3,
  page: 1,
  pageSize: 10,
} as const;

export const mdAnalysisSanctionLoadData = {
  month: 12,
  year: 2025,
  type: "Sanction Load Violation" as MdAnalysisType,
  months: 3,
  page: 1,
  pageSize: 10,
} as const;

export const mdAnalysisImproperData = {
  month: 12,
  year: 2025,
  type: "Improper MD" as MdAnalysisType,
  months: 3,
  page: 1,
  pageSize: 10,
} as const;
