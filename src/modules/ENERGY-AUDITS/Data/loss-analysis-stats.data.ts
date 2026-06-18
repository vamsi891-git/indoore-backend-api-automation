import { LossAnalysisStatsQuery } from "../Mapper/loss-analysis-stats.mapper";

export const lossAnalysisStatsLookupId = Number(
  process.env.ENERGY_AUDIT_LOSS_ANALYSIS_STATS_LOOKUP_ID ??
    process.env.ENERGY_AUDIT_NETWORK_TRENDS_LOOKUP_ID ??
    6081,
);

export const lossAnalysisStatsDefaultRange = {
  fromDate:
    process.env.ENERGY_AUDIT_LOSS_ANALYSIS_STATS_FROM_DATE ?? "2025-12-01",
  toDate: process.env.ENERGY_AUDIT_LOSS_ANALYSIS_STATS_TO_DATE ?? "2025-12-20",
} as const;

export function buildLossAnalysisStatsQuery(
  overrides: Partial<LossAnalysisStatsQuery> = {},
): LossAnalysisStatsQuery {
  return {
    networkLookupId: lossAnalysisStatsLookupId,
    ...lossAnalysisStatsDefaultRange,
    ...overrides,
  };
}
