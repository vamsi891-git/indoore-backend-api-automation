import { patternConsumptionData } from "./patternconsumption.data";
import { dailyConsumptionData } from "./dailyconsumption.data";

export type ConsumptionNegativeCase = {
  testName: string;
  tags: string[];
  path: string;
  params: Record<string, string | number>;
  expectedStatuses: number[];
  expectedCodes?: string[];
};

export const patternConsumptionNegativeCases: ConsumptionNegativeCase[] = [
  {
    testName: "pattern consumption missing patternType returns client error",
    tags: ["@consumption", "@pattern-consumption", "@negative"],
    path: "/indore/consumption/pattern-consumption",
    params: {
      page: patternConsumptionData.page,
      limit: patternConsumptionData.limit,
      month: patternConsumptionData.month,
      year: patternConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "pattern consumption invalid patternType returns client error",
    tags: ["@consumption", "@pattern-consumption", "@negative"],
    path: "/indore/consumption/pattern-consumption",
    params: {
      patternType: "not-a-pattern",
      page: patternConsumptionData.page,
      limit: patternConsumptionData.limit,
      month: patternConsumptionData.month,
      year: patternConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "pattern consumption month zero returns client error",
    tags: ["@consumption", "@pattern-consumption", "@negative"],
    path: "/indore/consumption/pattern-consumption",
    params: {
      patternType: patternConsumptionData.comparisonType,
      page: patternConsumptionData.page,
      limit: patternConsumptionData.limit,
      month: 0,
      year: patternConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "pattern consumption month thirteen returns client error",
    tags: ["@consumption", "@pattern-consumption", "@negative"],
    path: "/indore/consumption/pattern-consumption",
    params: {
      patternType: patternConsumptionData.comparisonType,
      page: patternConsumptionData.page,
      limit: patternConsumptionData.limit,
      month: 13,
      year: patternConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "pattern consumption page zero returns client error",
    tags: ["@consumption", "@pattern-consumption", "@negative"],
    path: "/indore/consumption/pattern-consumption",
    params: {
      patternType: patternConsumptionData.comparisonType,
      page: 0,
      limit: patternConsumptionData.limit,
      month: patternConsumptionData.month,
      year: patternConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "pattern consumption limit zero returns client error",
    tags: ["@consumption", "@pattern-consumption", "@negative"],
    path: "/indore/consumption/pattern-consumption",
    params: {
      patternType: patternConsumptionData.comparisonType,
      page: patternConsumptionData.page,
      limit: 0,
      month: patternConsumptionData.month,
      year: patternConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
];

export const monthlyNetMeterNegativeCases: ConsumptionNegativeCase[] = [
  {
    testName: "monthly net meter month zero returns client error",
    tags: ["@consumption", "@monthly-net-meter", "@negative"],
    path: "/indore/consumption/monthly-net-meter",
    params: { page: 1, limit: 10, month: 0, year: 2025 },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "monthly net meter year zero returns client error",
    tags: ["@consumption", "@monthly-net-meter", "@negative"],
    path: "/indore/consumption/monthly-net-meter",
    params: { page: 1, limit: 10, month: 12, year: 0 },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "monthly net meter page zero returns client error",
    tags: ["@consumption", "@monthly-net-meter", "@negative"],
    path: "/indore/consumption/monthly-net-meter",
    params: { page: 0, limit: 10, month: 12, year: 2025 },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
];

export const consumptionReportNegativeCases: ConsumptionNegativeCase[] = [
  {
    testName: "consumption report missing reportType returns client error",
    tags: ["@consumption", "@consumption-report", "@negative"],
    path: "/indore/consumption/report",
    params: {
      page: dailyConsumptionData.page,
      limit: dailyConsumptionData.limit,
      fromDate: dailyConsumptionData.fromDate,
      toDate: dailyConsumptionData.toDate,
      month: dailyConsumptionData.month,
      year: dailyConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "consumption report invalid reportType returns client error",
    tags: ["@consumption", "@consumption-report", "@negative"],
    path: "/indore/consumption/report",
    params: {
      reportType: "weekly",
      page: dailyConsumptionData.page,
      limit: dailyConsumptionData.limit,
      fromDate: dailyConsumptionData.fromDate,
      toDate: dailyConsumptionData.toDate,
      month: dailyConsumptionData.month,
      year: dailyConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "consumption report fromDate after toDate returns client error",
    tags: ["@consumption", "@consumption-report", "@negative"],
    path: "/indore/consumption/report",
    params: {
      reportType: "daily",
      page: dailyConsumptionData.page,
      limit: dailyConsumptionData.limit,
      fromDate: "2025-12-25",
      toDate: "2025-12-20",
      month: dailyConsumptionData.month,
      year: dailyConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "consumption report invalid fromDate format returns client error",
    tags: ["@consumption", "@consumption-report", "@negative"],
    path: "/indore/consumption/report",
    params: {
      reportType: "daily",
      page: dailyConsumptionData.page,
      limit: dailyConsumptionData.limit,
      fromDate: "20-12-2025",
      toDate: dailyConsumptionData.toDate,
      month: dailyConsumptionData.month,
      year: dailyConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
];

export const consumptionEdgeCases = {
  patternComparisonPage2: {
    patternType: "comparison" as const,
    page: 2,
    limit: 10,
    month: 12,
    year: 2025,
  },
  patternYearlyLimit1: {
    patternType: "yearly" as const,
    page: 1,
    limit: 1,
    month: 12,
    year: 2025,
  },
  monthlyNetMeterPage2: {
    page: 2,
    limit: 5,
    month: 12,
    year: 2025,
  },
  reportDailyPage2: {
    reportType: "daily" as const,
    page: 2,
    limit: 5,
    fromDate: "2025-12-19",
    toDate: "2025-12-20",
    month: 12,
    year: 2025,
  },
  reportHourlyLimit1: {
    reportType: "hourly" as const,
    page: 1,
    limit: 1,
    fromDate: "2025-12-19",
    toDate: "2025-12-20",
    month: 12,
    year: 2025,
  },
  reportMonthlyPage1: {
    reportType: "monthly" as const,
    page: 1,
    limit: 10,
    fromDate: "2025-12-19",
    toDate: "2025-12-20",
    month: 12,
    year: 2025,
  },
};
