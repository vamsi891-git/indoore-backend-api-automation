import { energyAuditDateRange } from "./energy-audits.common.data";
import { LossAnalysisStatsQuery } from "../Mapper/loss-analysis-stats.mapper";

export const lossAnalysisStatsLookupId = Number(
  process.env.ENERGY_AUDIT_LOSS_ANALYSIS_STATS_LOOKUP_ID ??
    process.env.ENERGY_AUDIT_NETWORK_TRENDS_LOOKUP_ID ??
    6081,
);

export const lossAnalysisStatsDefaultRange = {
  fromDate:
    process.env.ENERGY_AUDIT_LOSS_ANALYSIS_STATS_FROM_DATE ??
    energyAuditDateRange.fromDate,
  toDate:
    process.env.ENERGY_AUDIT_LOSS_ANALYSIS_STATS_TO_DATE ??
    energyAuditDateRange.toDate,
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
