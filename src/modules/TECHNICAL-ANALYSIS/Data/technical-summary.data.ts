import { TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { TechnicalSummaryQuery } from "../Api/technical-summary.api";
import type { TechnicalSummaryResponse } from "../Mapper/technical-summary.mapper";
import { technicalAnalysisLiveConfigs } from "./technicalanalysis.data";

export const technicalSummaryMaxResponseTimeMs = TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS;

export const technicalSummaryDefaultMonth = 12;
export const technicalSummaryDefaultYear = 2025;
/** Alternate billing period referenced by live report smoke data. */
export const technicalSummaryAltYear = 2024;

export const technicalSummaryExpectedAnalysisTypes =
  technicalAnalysisLiveConfigs.map((config) => config.analysisType);

export type TechnicalSummaryScenario =
  | "dev_live_primary"
  | "dev_live_alt_month"
  | "invalid_month_zero"
  | "invalid_month_13"
  | "missing_month"
  | "missing_year";

export interface TechnicalSummaryTestCase {
  testName: string;
  scenario: TechnicalSummaryScenario;
  tags: string[];
  expectedStatus?: number;
}

export function resolveTechnicalSummaryQuery(
  scenario: TechnicalSummaryScenario,
): TechnicalSummaryQuery {
  switch (scenario) {
    case "dev_live_primary":
      return {
        month: technicalSummaryDefaultMonth,
        year: technicalSummaryDefaultYear,
      };
    case "dev_live_alt_month":
      return {
        month: technicalSummaryDefaultMonth,
        year: technicalSummaryAltYear,
      };
    case "invalid_month_zero":
      return { month: 0, year: technicalSummaryDefaultYear };
    case "invalid_month_13":
      return { month: 13, year: technicalSummaryDefaultYear };
    case "missing_month":
      return { year: technicalSummaryDefaultYear };
    case "missing_year":
      return { month: technicalSummaryDefaultMonth };
    default:
      return {
        month: technicalSummaryDefaultMonth,
        year: technicalSummaryDefaultYear,
      };
  }
}

export const technicalSummaryContractEmptyResponse: TechnicalSummaryResponse = {
  success: true,
  data: {
    month: technicalSummaryDefaultMonth,
    year: technicalSummaryDefaultYear,
    reports: [],
  },
};

/** @deprecated Use named exports from this module. */
export const technicalSummaryData = {
  month: technicalSummaryDefaultMonth,
  year: technicalSummaryDefaultYear,
};

export const technicalSummaryTestCases: TechnicalSummaryTestCase[] = [
  {
    testName:
      "Validate GET /indore/analysis/technical/summary — month zero rejected",
    scenario: "invalid_month_zero",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/summary — month 13 rejected",
    scenario: "invalid_month_13",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/summary — missing month rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/summary — missing year rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/summary — live aggregate counts",
    scenario: "dev_live_primary",
    tags: ["@technical", "@technical-summary", "@smoke"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/summary — alternate year",
    scenario: "dev_live_alt_month",
    tags: ["@technical", "@technical-summary", "@edge"],
  },
];
