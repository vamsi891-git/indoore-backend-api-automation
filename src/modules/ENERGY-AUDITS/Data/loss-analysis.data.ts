import {
  LossAnalysisQuery,
  LossNetworkType,
  LossReportType,
} from "../Mapper/loss-analysis.mapper";
import { energyAuditDateRange } from "./energy-audits.common.data";

const fromParts = energyAuditDateRange.fromDate.split("-").map(Number);

export const lossAnalysisBaseQuery = {
  month: fromParts[1] || 12,
  year: fromParts[0] || 2025,
  fromDate: energyAuditDateRange.fromDate,
  toDate: energyAuditDateRange.toDate,
  page: 1,
  limit: 30,
} as const;

/** Feeder BILLING has returned 500 at limit 30 on localhost; keep a smaller page. */
export const feederBillingLimit = 10;

export const dtrNetworkLookupId = Number(
  process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5,
);

export const feederNetworkLookupId = Number(
  process.env.ENERGY_AUDIT_FEEDER_NETWORK_LOOKUP_ID ?? 4,
);

export const lossReportTypes: LossReportType[] = ["billing", "dp", "ls"];

/** Feeder BILLING currently 500s on the live API; DP/LS are the working feeder GETs. */
export const feederLossReportTypes: LossReportType[] = ["dp", "ls"];

export const EXPECTED_LOSS_ANALYSIS_BILLING_COLUMNS = [
  "circle",
  "division",
  "zone",
  "feeder",
  "dtrName",
  "mf",
  "meterSerialNumber",
  "inputUnits",
  "consumerCount",
  "totalSoldUnits",
  "lossKwh",
  "billingEfficiencyPct",
  "lossPct",
] as const;

export const EXPECTED_LOSS_ANALYSIS_DP_COLUMNS =
  EXPECTED_LOSS_ANALYSIS_BILLING_COLUMNS;

export const EXPECTED_LOSS_ANALYSIS_LS_COLUMNS = [
  "circle",
  "division",
  "zone",
  "feeder",
  "dtrCode",
  "dtrName",
  "dtrRating",
  "mf",
  "meterSerialNumber",
  "consumerCount",
  "inputUnits",
  "totalSoldUnits",
  "lossKwh",
  "billingEfficiencyPct",
  "lossPct",
] as const;

export function expectedLossAnalysisColumns(
  reportType: LossReportType,
): readonly string[] {
  if (reportType === "ls") {
    return EXPECTED_LOSS_ANALYSIS_LS_COLUMNS;
  }
  if (reportType === "dp") {
    return EXPECTED_LOSS_ANALYSIS_DP_COLUMNS;
  }
  return EXPECTED_LOSS_ANALYSIS_BILLING_COLUMNS;
}

export function buildLossAnalysisQuery(
  reportType: LossReportType,
  networkType: LossNetworkType,
  networkLookupId: number,
  overrides: Partial<LossAnalysisQuery> = {},
): LossAnalysisQuery {
  const limit =
    networkType === "feeder" && reportType === "billing"
      ? feederBillingLimit
      : lossAnalysisBaseQuery.limit;
  return {
    "report-type": reportType,
    ...lossAnalysisBaseQuery,
    limit,
    networkType,
    networkLookupId,
    ...overrides,
  };
}
