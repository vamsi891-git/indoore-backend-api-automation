import { commercialSummaryData } from "./commercial-summary.data";
import { consumptionCompareLastMonthData } from "./consumptioncompare.data";
import { consumptionPatternData } from "./consumptionpattern.data";
import { dayNightZeroData } from "./daynight.data";
import { lfAnalysisData } from "./loadfactor.api";
import { mdAnalysisCdCompareData } from "./mdanalysis.data";
import { pfAnalysisQuery } from "./powerfactor.data";
import { commercialPaths } from "../Validator/commercial-common.validator";

export type CommercialNegativeCase = {
  testName: string;
  tags: string[];
  path: string;
  params: Record<string, string | number>;
  expectedStatuses: number[];
  expectedCodes?: string[];
};

/**
 * Only cases the live API actually rejects with 4xx.
 * Params the API soft-defaults (threshold, operator, type, pattern) are covered
 * as permissive/default edge cases instead of false negatives.
 */
export const allCommercialNegativeCases: CommercialNegativeCase[] = [
  {
    testName: "Dashboard — month is required; report is rejected without it",
    tags: ["@commercial", "@commercial-summary", "@negative"],
    path: commercialPaths.summary,
    params: {
      year: commercialSummaryData.year,
      pfThreshold: commercialSummaryData.pfThreshold,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Dashboard — month 0 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@commercial-summary", "@negative"],
    path: commercialPaths.summary,
    params: {
      month: 0,
      year: commercialSummaryData.year,
      pfThreshold: commercialSummaryData.pfThreshold,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Dashboard — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@commercial-summary", "@negative"],
    path: commercialPaths.summary,
    params: {
      month: 13,
      year: commercialSummaryData.year,
      pfThreshold: commercialSummaryData.pfThreshold,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Power Factor Violation — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@power-factor", "@negative"],
    path: commercialPaths.pf,
    params: {
      month: 13,
      year: pfAnalysisQuery.year,
      threshold: pfAnalysisQuery.threshold,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Power Factor Violation — page 0 is rejected (page must start at 1)",
    tags: ["@commercial", "@power-factor", "@negative"],
    path: commercialPaths.pf,
    params: {
      month: pfAnalysisQuery.month,
      year: pfAnalysisQuery.year,
      threshold: pfAnalysisQuery.threshold,
      page: 0,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Maximum Demand — unknown report type is rejected",
    tags: ["@commercial", "@md-analysis", "@negative"],
    path: commercialPaths.md,
    params: {
      month: mdAnalysisCdCompareData.month,
      year: mdAnalysisCdCompareData.year,
      type: "not-a-md-type",
      months: 3,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Maximum Demand — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@md-analysis", "@negative"],
    path: commercialPaths.md,
    params: {
      month: 13,
      year: mdAnalysisCdCompareData.year,
      type: mdAnalysisCdCompareData.type,
      months: 3,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Load Factor — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@lf-analysis", "@negative"],
    path: commercialPaths.lf,
    params: {
      month: 13,
      year: lfAnalysisData.year,
      threshold: lfAnalysisData.threshold,
      operator: lfAnalysisData.operator,
      months: 1,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Load Factor — page 0 is rejected (page must start at 1)",
    tags: ["@commercial", "@lf-analysis", "@negative"],
    path: commercialPaths.lf,
    params: {
      month: lfAnalysisData.month,
      year: lfAnalysisData.year,
      threshold: lfAnalysisData.threshold,
      operator: lfAnalysisData.operator,
      months: 1,
      page: 0,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Consumption Compare — unknown report type is rejected",
    tags: ["@commercial", "@consumption-compare", "@negative"],
    path: commercialPaths.consumptionCompare,
    params: {
      month: consumptionCompareLastMonthData.month,
      year: consumptionCompareLastMonthData.year,
      type: "not-a-compare-type",
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Consumption Compare — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@consumption-compare", "@negative"],
    path: commercialPaths.consumptionCompare,
    params: {
      month: 13,
      year: consumptionCompareLastMonthData.year,
      type: consumptionCompareLastMonthData.type,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Consumption Pattern — unknown report type is rejected",
    tags: ["@commercial", "@consumption-pattern", "@negative"],
    path: commercialPaths.consumptionPattern,
    params: {
      month: consumptionPatternData.month,
      year: consumptionPatternData.year,
      type: "not-a-pattern-type",
      connectionCategory: "domestic",
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Consumption Pattern — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@consumption-pattern", "@negative"],
    path: commercialPaths.consumptionPattern,
    params: {
      month: 13,
      year: consumptionPatternData.year,
      pattern: "zero",
      months: 1,
      threshold: 100,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Consumption Pattern — page 0 is rejected (page must start at 1)",
    tags: ["@commercial", "@consumption-pattern", "@negative"],
    path: commercialPaths.consumptionPattern,
    params: {
      month: consumptionPatternData.month,
      year: consumptionPatternData.year,
      pattern: "zero",
      months: 1,
      threshold: 100,
      page: 0,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Day and Night — month 13 is rejected (month must be 1 to 12)",
    tags: ["@commercial", "@day-night", "@negative"],
    path: commercialPaths.dayNight,
    params: {
      month: 13,
      year: dayNightZeroData.year,
      type: dayNightZeroData.type,
      page: 1,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Day and Night — page 0 is rejected (page must start at 1)",
    tags: ["@commercial", "@day-night", "@negative"],
    path: commercialPaths.dayNight,
    params: {
      month: dayNightZeroData.month,
      year: dayNightZeroData.year,
      type: dayNightZeroData.type,
      page: 0,
      pageSize: 10,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
];

export const commercialEdgeCases = {
  pfPage2: {
    ...pfAnalysisQuery,
    page: 2,
    pageSize: 10,
  },
  pfPageSize1: {
    ...pfAnalysisQuery,
    page: 1,
    pageSize: 1,
  },
  /** API defaults threshold when omitted */
  pfMissingThreshold: {
    month: pfAnalysisQuery.month,
    year: pfAnalysisQuery.year,
    page: 1,
    pageSize: 10,
  },
  pfDomestic: {
    month: pfAnalysisQuery.month,
    year: pfAnalysisQuery.year,
    threshold: pfAnalysisQuery.threshold,
    connectionCategory: "domestic" as const,
    page: 1,
    pageSize: 10,
  },
  pfNonDomestic: {
    month: pfAnalysisQuery.month,
    year: pfAnalysisQuery.year,
    threshold: pfAnalysisQuery.threshold,
    connectionCategory: "non-domestic" as const,
    page: 1,
    pageSize: 10,
  },
  lfGt100: {
    month: lfAnalysisData.month,
    year: lfAnalysisData.year,
    type: "LF > 100%" as const,
    page: 1,
    pageSize: 20,
  },
  lfLt5Last3m: {
    month: lfAnalysisData.month,
    year: lfAnalysisData.year,
    type: "LF < 5% Last Three month" as const,
    page: 1,
    pageSize: 20,
  },
  /** API defaults type when omitted → LF < 5% */
  lfMissingOperator: {
    month: lfAnalysisData.month,
    year: lfAnalysisData.year,
    page: 1,
    pageSize: 20,
  },
  patternLow3m: {
    month: consumptionPatternData.month,
    year: consumptionPatternData.year,
    type: "100 unit kwh from Last Three months continuous" as const,
    connectionCategory: "domestic" as const,
    pattern: "low" as const,
    months: 3,
    threshold: 100,
    page: 1,
    pageSize: 10,
  },
  patternZero1mPage2: {
    ...consumptionPatternData,
    page: 2,
    pageSize: 10,
  },
  patternZero1mPageSize1: {
    ...consumptionPatternData,
    page: 1,
    pageSize: 1,
  },
  patternZero3m: {
    month: consumptionPatternData.month,
    year: consumptionPatternData.year,
    type: "Zero Consumption for Last 3 months" as const,
    connectionCategory: "domestic" as const,
    pattern: "zero" as const,
    months: 3,
    threshold: 100,
    page: 1,
    pageSize: 10,
  },
  /** API defaults type when omitted */
  patternMissingType: {
    month: consumptionPatternData.month,
    year: consumptionPatternData.year,
    connectionCategory: "domestic" as const,
    page: 1,
    pageSize: 10,
  },
  patternZero6m: {
    month: consumptionPatternData.month,
    year: consumptionPatternData.year,
    type: "Zero Consumption for Last 6 months" as const,
    connectionCategory: "domestic" as const,
    pattern: "zero" as const,
    months: 6,
    threshold: 100,
    page: 1,
    pageSize: 20,
  },
  comparePage2: {
    ...consumptionCompareLastMonthData,
    page: 2,
    pageSize: 10,
  },
  /** API defaults type when omitted */
  compareMissingType: {
    month: consumptionCompareLastMonthData.month,
    year: consumptionCompareLastMonthData.year,
    page: 1,
    pageSize: 10,
  },
  /** API defaults MD type when omitted */
  mdMissingType: {
    month: mdAnalysisCdCompareData.month,
    year: mdAnalysisCdCompareData.year,
    months: 3,
    page: 1,
    pageSize: 10,
  },
  dayNightZero: {
    ...dayNightZeroData,
  },
  dayNightLte: {
    month: dayNightZeroData.month,
    year: dayNightZeroData.year,
    type: "Night consumption <= 10% of Day consumption" as const,
    connectionCategory: "domestic" as const,
    page: 1,
    pageSize: 10,
  },
};
