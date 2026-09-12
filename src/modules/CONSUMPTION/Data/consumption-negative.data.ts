import { patternConsumptionData } from "./patternconsumption.data";
import { dailyConsumptionData } from "./dailyconsumption.data";
import {
  consumptionReportFromDate,
  consumptionReportMonth,
  consumptionReportToDate,
  consumptionReportYear,
} from "./consumption-report-window.data";
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
    testName: "Pattern consumption — leaving out the pattern type is rejected",
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
    testName: "Pattern consumption — an unknown pattern type is rejected",
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
    testName: "Pattern consumption — month zero is rejected",
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
    testName: "Pattern consumption — month thirteen is rejected",
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
    testName: "Pattern consumption — page zero is rejected",
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
    testName: "Pattern consumption — limit zero is rejected",
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
    testName: "Monthly net meter — month zero is rejected",
    tags: ["@consumption", "@monthly-net-meter", "@negative"],
    path: "/indore/consumption/monthly-net-meter",
    params: { page: 1, limit: 10, month: 0, year: consumptionReportYear },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Monthly net meter — year zero is rejected",
    tags: ["@consumption", "@monthly-net-meter", "@negative"],
    path: "/indore/consumption/monthly-net-meter",
    params: { page: 1, limit: 10, month: consumptionReportMonth, year: 0 },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Monthly net meter — page zero is rejected",
    tags: ["@consumption", "@monthly-net-meter", "@negative"],
    path: "/indore/consumption/monthly-net-meter",
    params: {
      page: 0,
      limit: 10,
      month: consumptionReportMonth,
      year: consumptionReportYear,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
];

export const consumptionReportNegativeCases: ConsumptionNegativeCase[] = [
  {
    testName: "Daily consumption — leaving out the report type is rejected",
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
    testName: "Daily consumption — an unknown report type is rejected",
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
    testName: "Daily consumption — start date after end date is rejected",
    tags: ["@consumption", "@consumption-report", "@negative"],
    path: "/indore/consumption/report",
    params: {
      reportType: "daily",
      page: dailyConsumptionData.page,
      limit: dailyConsumptionData.limit,
      fromDate: consumptionReportToDate,
      toDate: consumptionReportFromDate,
      month: dailyConsumptionData.month,
      year: dailyConsumptionData.year,
    },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Daily consumption — a badly formatted start date is rejected",
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

const reportWindow = {
  fromDate: consumptionReportFromDate,
  toDate: consumptionReportToDate,
  month: consumptionReportMonth,
  year: consumptionReportYear,
};

export const consumptionEdgeCases = {
  patternPage2: {
    page: 2,
    limit: 5,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  patternLimit1: {
    page: 1,
    limit: 1,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  patternUnusedQuery: {
    page: 1,
    limit: 30,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  patternFarPage: {
    page: 99999,
    limit: 30,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  monthlyNetMeterPage2: {
    page: 2,
    limit: 5,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  monthlyNetMeterLimit1: {
    page: 1,
    limit: 1,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  monthlyNetMeterUnusedQuery: {
    page: 1,
    limit: 10,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  monthlyNetMeterFarPage: {
    page: 99999,
    limit: 10,
    month: consumptionReportMonth,
    year: consumptionReportYear,
  },
  reportDailyPage2: {
    reportType: "daily" as const,
    page: 2,
    limit: 5,
    ...reportWindow,
  },
  reportDailyLimit1: {
    reportType: "daily" as const,
    page: 1,
    limit: 1,
    ...reportWindow,
  },
  reportDailyUnusedQuery: {
    reportType: "daily" as const,
    page: 1,
    limit: 10,
    ...reportWindow,
  },
  reportDailyFarPage: {
    reportType: "daily" as const,
    page: 99999,
    limit: 10,
    ...reportWindow,
  },
  reportHourlyLimit1: {
    reportType: "hourly" as const,
    page: 1,
    limit: 1,
    ...reportWindow,
  },
  reportMonthlyPage2: {
    reportType: "monthly" as const,
    page: 2,
    limit: 5,
    ...reportWindow,
  },
  reportNightZeroPage2: {
    reportType: "nightZero" as const,
    page: 2,
    limit: 5,
    ...reportWindow,
  },
};
