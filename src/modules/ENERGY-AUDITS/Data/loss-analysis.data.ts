import {
  LossAnalysisQuery,
  LossNetworkType,
  LossReportType,
} from "../Mapper/loss-analysis.mapper";

export const lossAnalysisBaseQuery = {
  month: 12,
  year: 2025,
  fromDate: "2025-12-20",
  toDate: "2025-12-20",
  page: 1,
  limit: 100,
} as const;

export const dtrNetworkLookupId = Number(
  process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5,
);

export const feederNetworkLookupId = Number(
  process.env.ENERGY_AUDIT_FEEDER_NETWORK_LOOKUP_ID ?? 4,
);

export const lossReportTypes: LossReportType[] = ["billing", "dp", "ls"];

export function buildLossAnalysisQuery(
  reportType: LossReportType,
  networkType: LossNetworkType,
  networkLookupId: number,
  overrides: Partial<LossAnalysisQuery> = {},
): LossAnalysisQuery {
  return {
    "report-type": reportType,
    ...lossAnalysisBaseQuery,
    networkType,
    networkLookupId,
    ...overrides,
  };
}
