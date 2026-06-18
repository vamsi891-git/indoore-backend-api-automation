import {
  HourlyLossHierarchyType,
  HourlyLossReportQuery,
} from "../Mapper/hourly-loss-report.mapper";
import {
  dtrNetworkLookupId,
  feederNetworkLookupId,
} from "./loss-analysis.data";

export const hourlyLossReportBaseQuery = {
  fromDate: "2025-12-20",
  toDate: "2025-12-20",
  page: 1,
  limit: 10,
} as const;

export function buildHourlyLossReportQuery(
  hierarchyType: HourlyLossHierarchyType,
  networkLookupId: number,
  overrides: Partial<HourlyLossReportQuery> = {},
): HourlyLossReportQuery {
  return {
    hierarchyType,
    networkLookupId,
    ...hourlyLossReportBaseQuery,
    ...overrides,
  };
}

export function buildDtrHourlyLossReportQuery(
  overrides: Partial<HourlyLossReportQuery> = {},
): HourlyLossReportQuery {
  return buildHourlyLossReportQuery("dtr", dtrNetworkLookupId, overrides);
}

export function buildFeederHourlyLossReportQuery(
  overrides: Partial<HourlyLossReportQuery> = {},
): HourlyLossReportQuery {
  return buildHourlyLossReportQuery("feeder", feederNetworkLookupId, overrides);
}
