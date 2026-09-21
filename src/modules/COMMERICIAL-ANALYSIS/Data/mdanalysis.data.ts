import { commercialAnalysisWindow } from "./commercial-window.data";

/** API enum values for `type` query param — commercial.schemas MD_ANALYSIS_TYPES */
export type MdAnalysisType = "MD > CD Last Three Month" | "Sanction Load Violation" | "Improper MD";

export type MdConnectionCategory = "domestic" | "non-domestic";

export const MD_ANALYSIS_TYPES: MdAnalysisType[] = [
  "MD > CD Last Three Month",
  "Sanction Load Violation",
  "Improper MD",
];

/** Improper MD strips connectionCategory and returns mdDate, not md. */
export const MD_CATEGORY_SPLIT_TYPES: MdAnalysisType[] = [
  "MD > CD Last Three Month",
  "Sanction Load Violation",
];

const MD_SHARED_LOAD_COLUMN_KEYS = [
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

/** Live GET /analysis/commercial/md?type=MD > CD Last Three Month | Sanction Load Violation */
export const MD_LOAD_GRID_COLUMN_KEYS = [
  ...MD_SHARED_LOAD_COLUMN_KEYS,
  "sanctionedLoad",
  "md",
] as const;

/** Live GET /analysis/commercial/md?type=Improper MD */
export const MD_IMPROPER_GRID_COLUMN_KEYS = [
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
  "mdDate",
] as const;

export function mdGridColumnKeys(type: MdAnalysisType): readonly string[] {
  return type === "Improper MD" ? MD_IMPROPER_GRID_COLUMN_KEYS : MD_LOAD_GRID_COLUMN_KEYS;
}

export const mdAnalysisCdCompareData = {
  ...commercialAnalysisWindow,
  type: "MD > CD Last Three Month" as MdAnalysisType,
  page: 1,
  pageSize: 10,
} as const;

export const mdAnalysisSanctionLoadData = {
  ...commercialAnalysisWindow,
  type: "Sanction Load Violation" as MdAnalysisType,
  page: 1,
  pageSize: 10,
} as const;

export const mdAnalysisImproperData = {
  ...commercialAnalysisWindow,
  type: "Improper MD" as MdAnalysisType,
  page: 1,
  pageSize: 10,
} as const;

export const mdSmokeQueries = [
  mdAnalysisCdCompareData,
  mdAnalysisSanctionLoadData,
  mdAnalysisImproperData,
] as const;

export const mdCategoryCountBase = {
  ...commercialAnalysisWindow,
  page: 1,
  pageSize: 10,
} as const;

export type MdCategoryCountCase = {
  label: string;
  type: MdAnalysisType;
  connectionCategory: MdConnectionCategory;
  query: {
    month: number;
    year: number;
    type: MdAnalysisType;
    connectionCategory: MdConnectionCategory;
    page: number;
    pageSize: number;
  }; /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

/** MD > CD and Sanction Load honor connectionCategory; Improper MD does not. */
export const mdConnectionCategoryCases: MdCategoryCountCase[] = MD_CATEGORY_SPLIT_TYPES.flatMap(
  (type) =>
    (["domestic", "non-domestic"] as const).map((connectionCategory) => ({
      label: `${type} / ${connectionCategory}`,
      type,
      connectionCategory,
      query: {
        ...mdCategoryCountBase,
        type,
        connectionCategory,
      },
    })),
);

export const mdTypeSplitCases: Array<{
  type: MdAnalysisType;
  unfilteredQuery: {
    month: number;
    year: number;
    type: MdAnalysisType;
    page: number;
    pageSize: number;
  };
  domesticQuery: MdCategoryCountCase["query"];
  nonDomesticQuery: MdCategoryCountCase["query"];
}> = MD_CATEGORY_SPLIT_TYPES.map((type) => ({
  type,
  unfilteredQuery: { ...mdCategoryCountBase, type },
  domesticQuery: {
    ...mdCategoryCountBase,
    type,
    connectionCategory: "domestic" as const,
  },
  nonDomesticQuery: {
    ...mdCategoryCountBase,
    type,
    connectionCategory: "non-domestic" as const,
  },
}));
