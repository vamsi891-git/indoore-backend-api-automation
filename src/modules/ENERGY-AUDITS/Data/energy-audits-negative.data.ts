import { energyAuditDateRange, energyAuditPaths } from "./energy-audits.common.data";
import { dtrNetworkLookupId } from "./loss-analysis.data";
import { lossAnalysisStatsLookupId } from "./loss-analysis-stats.data";
import { lossAnalysisTrendsLookupId } from "./loss-analysis-trends.data";
import { networkTrendsLookupId } from "./network-trends.data";

export const EnergyAuditInvalidQueries = [
  {
    testName: "GET /energy-audit/loss-analysis — networkType=foo",
    path: energyAuditPaths.lossAnalysis,
    query: `report-type=billing&month=12&year=2025&fromDate=${energyAuditDateRange.fromDate}&toDate=${energyAuditDateRange.toDate}&networkType=foo&networkLookupId=${dtrNetworkLookupId}&page=1&limit=10`,
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /energy-audit/loss-analysis — page=0",
    path: energyAuditPaths.lossAnalysis,
    query: `report-type=billing&month=12&year=2025&fromDate=${energyAuditDateRange.fromDate}&toDate=${energyAuditDateRange.toDate}&networkType=dtr&networkLookupId=${dtrNetworkLookupId}&page=0&limit=10`,
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /energy-audit/hourly-loss-report — fromDate=not-a-date",
    path: energyAuditPaths.hourlyLossReport,
    query: `hierarchyType=dtr&networkLookupId=${dtrNetworkLookupId}&fromDate=not-a-date&toDate=${energyAuditDateRange.toDate}&page=1&limit=10`,
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /energy-audit/loss-analysis-stats — fromDate=not-a-date",
    path: energyAuditPaths.lossAnalysisStats,
    query: `networkLookupId=${lossAnalysisStatsLookupId}&fromDate=not-a-date&toDate=${energyAuditDateRange.toDate}`,
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /energy-audit/loss-analysis-trends — networkLookupId=abc",
    path: energyAuditPaths.lossAnalysisTrends,
    query: `networkLookupId=abc`,
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /energy-audit/network-trends — report-type=foo",
    path: energyAuditPaths.networkTrends,
    query: `report-type=foo&networkLookupId=${networkTrendsLookupId}`,
    expectedStatus: [400, 422] as const,
  },
] as const;

export const EnergyAuditUnauthorizedCases = [
  {
    testName: "GET /energy-audit/loss-analysis — without auth returns 401",
    path: energyAuditPaths.lossAnalysis,
    query: `report-type=billing&month=12&year=2025&fromDate=${energyAuditDateRange.fromDate}&toDate=${energyAuditDateRange.toDate}&networkType=dtr&networkLookupId=${dtrNetworkLookupId}&page=1&limit=10`,
  },
  {
    testName: "GET /energy-audit/hourly-loss-report — without auth returns 401",
    path: energyAuditPaths.hourlyLossReport,
    query: `hierarchyType=dtr&networkLookupId=${dtrNetworkLookupId}&fromDate=${energyAuditDateRange.fromDate}&toDate=${energyAuditDateRange.toDate}&page=1&limit=10`,
  },
  {
    testName: "GET /energy-audit/loss-analysis-stats — without auth returns 401",
    path: energyAuditPaths.lossAnalysisStats,
    query: `networkLookupId=${lossAnalysisStatsLookupId}&fromDate=${energyAuditDateRange.fromDate}&toDate=${energyAuditDateRange.toDate}`,
  },
  {
    testName: "GET /energy-audit/loss-analysis-trends — without auth returns 401",
    path: energyAuditPaths.lossAnalysisTrends,
    query: `networkLookupId=${lossAnalysisTrendsLookupId}`,
  },
  {
    testName: "GET /energy-audit/network-trends — without auth returns 401",
    path: energyAuditPaths.networkTrends,
    query: `report-type=billing&networkLookupId=${networkTrendsLookupId}`,
  },
] as const;
