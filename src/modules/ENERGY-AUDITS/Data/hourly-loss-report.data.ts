import {
  HourlyLossHierarchyType,
  HourlyLossReportQuery,
} from "../Mapper/hourly-loss-report.mapper";
import { energyAuditDateRange } from "./energy-audits.common.data";
import {
  dtrNetworkLookupId,
  feederNetworkLookupId,
} from "./loss-analysis.data";

export const hourlyLossReportBaseQuery = {
  fromDate: energyAuditDateRange.fromDate,
  toDate: energyAuditDateRange.toDate,
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
  const lookupId = Number(
    process.env.ENERGY_AUDIT_HOURLY_FEEDER_LOOKUP_ID ??
      process.env.ENERGY_AUDIT_FEEDER_NETWORK_LOOKUP_ID ??
      6081,
  );
  return buildHourlyLossReportQuery(
    "feeder",
    Number.isFinite(lookupId) && lookupId > 0 ? lookupId : feederNetworkLookupId,
    overrides,
  );
}
