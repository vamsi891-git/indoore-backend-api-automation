import { LossAnalysisTrendsQuery } from "../Mapper/loss-analysis-trends.mapper";

export const lossAnalysisTrendsLookupId = Number(
  process.env.ENERGY_AUDIT_LOSS_ANALYSIS_TRENDS_LOOKUP_ID ??
    process.env.ENERGY_AUDIT_NETWORK_TRENDS_LOOKUP_ID ??
    6081,
);

export function buildLossAnalysisTrendsQuery(
  overrides: Partial<LossAnalysisTrendsQuery> = {},
): LossAnalysisTrendsQuery {
  return {
    networkLookupId: lossAnalysisTrendsLookupId,
    ...overrides,
  };
}
