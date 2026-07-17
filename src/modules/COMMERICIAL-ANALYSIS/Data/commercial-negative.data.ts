import { commercialSummaryData } from "./commercial-summary.data";
import { consumptionCompareLastMonthData } from "./consumptioncompare.data";
import { consumptionPatternData } from "./consumptionpattern.data";
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
    testName: "summary missing month returns client error",
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
    testName: "summary month zero returns client error",
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
    testName: "summary month thirteen returns client error",
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
    testName: "summary invalid pfThreshold returns client error",
    tags: ["@commercial", "@commercial-summary", "@negative"],
    path: commercialPaths.summary,
    params: {
      month: commercialSummaryData.month,
      year: commercialSummaryData.year,
      pfThreshold: -1,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "pf month thirteen returns client error",
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
    testName: "pf page zero returns client error",
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
    testName: "md invalid type returns client error",
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
    testName: "md month thirteen returns client error",
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
    testName: "lf month thirteen returns client error",
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
    testName: "lf page zero returns client error",
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
    testName: "consumption-compare invalid type returns client error",
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
    testName: "consumption-compare month thirteen returns client error",
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
    testName: "consumption-pattern month thirteen returns client error",
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
    testName: "consumption-pattern page zero returns client error",
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
  lfGt100: {
    month: lfAnalysisData.month,
    year: lfAnalysisData.year,
    threshold: 100,
    operator: "gt" as const,
    months: 1,
    page: 1,
    pageSize: 20,
  },
  lfLt5Last3m: {
    month: lfAnalysisData.month,
    year: lfAnalysisData.year,
    threshold: 5,
    operator: "lt" as const,
    months: 3,
    page: 1,
    pageSize: 20,
  },
  /** API defaults operator when omitted */
  lfMissingOperator: {
    month: lfAnalysisData.month,
    year: lfAnalysisData.year,
    threshold: lfAnalysisData.threshold,
    months: 1,
    page: 1,
    pageSize: 20,
  },
  patternLow3m: {
    month: consumptionPatternData.month,
    year: consumptionPatternData.year,
    pattern: "low" as const,
    months: 3,
    threshold: 100,
    page: 1,
    pageSize: 20,
  },
  patternZero6m: {
    month: consumptionPatternData.month,
    year: consumptionPatternData.year,
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
};
