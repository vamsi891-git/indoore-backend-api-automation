import {
  NetworkTrendQuery,
  NetworkTrendReportType,
} from "../Mapper/network-trends.mapper";

export const networkTrendsLookupId = Number(
  process.env.ENERGY_AUDIT_NETWORK_TRENDS_LOOKUP_ID ?? 6081,
);

export const networkTrendReportTypes: NetworkTrendReportType[] = [
  "billing",
  "dp",
  "ls",
];

export function buildNetworkTrendsQuery(
  reportType: NetworkTrendReportType,
  networkLookupId: number = networkTrendsLookupId,
): NetworkTrendQuery {
  return {
    "report-type": reportType,
    networkLookupId,
  };
}
