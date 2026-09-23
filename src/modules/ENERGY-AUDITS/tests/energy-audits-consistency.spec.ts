import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { LossAnalysisStatsApi } from "../Api/loss-analysis-stats.api";
import { LossAnalysisTrendsApi } from "../Api/loss-analysis-trends.api";
import { buildLossAnalysisStatsQuery } from "../Data/loss-analysis-stats.data";
import { buildLossAnalysisTrendsQuery } from "../Data/loss-analysis-trends.data";
import { mapLossAnalysisStatsData } from "../Mapper/loss-analysis-stats.mapper";
import { mapLossAnalysisTrendsData } from "../Mapper/loss-analysis-trends.mapper";
import { LossAnalysisStatsValidator } from "../Validator/loss-analysis-stats.validator";

/**
 * Cross-API count/metric consistency — tagged @consistency (out of default smoke).
 * Rule: for a single-day stats range, peak/lowest must match trends max/min.
 */
test.describe("Energy Audits — stats ↔ trends consistency", () => {
  test.describe.configure({ retries: 0, mode: "serial" });
  test.setTimeout(120000);

  test(
    "stats peak/lowest lossPct match trends series max/min (same day)",
    {
      tag: ["@consistency", "@energy-audit", "@loss-analysis-stats", "@loss-analysis-trends"],
    },
    async ({ authenticatedApi }) => {
      const statsApi = new LossAnalysisStatsApi(authenticatedApi);
      const trendsApi = new LossAnalysisTrendsApi(authenticatedApi);
      const statsQuery = buildLossAnalysisStatsQuery();
      const trendsQuery = buildLossAnalysisTrendsQuery({
        networkLookupId: statsQuery.networkLookupId,
      });

      const statsResult = await statsApi.getLossAnalysisStats(statsQuery);
      const trendsResult = await trendsApi.getLossAnalysisTrends(trendsQuery);
      expect(statsResult.rawResponse.status()).toBe(200);
      expect(trendsResult.rawResponse.status()).toBe(200);
      expect(statsResult.responseBody.success).toBe(true);
      expect(trendsResult.responseBody.success).toBe(true);

      const stats = mapLossAnalysisStatsData(statsResult.responseBody);
      const trends = mapLossAnalysisTrendsData(trendsResult.responseBody);

      if (stats.fromDate !== stats.toDate) {
        test.skip(
          true,
          `stats range is multi-day (${stats.fromDate}..${stats.toDate}); peak/lowest vs trends needs same-day`,
        );
      }
      if (trends.date !== stats.fromDate) {
        test.skip(
          true,
          `trends.date=${trends.date} != stats day=${stats.fromDate} — cannot compare peak/lowest across different anchors`,
        );
      }

      const validator = new LossAnalysisStatsValidator();
      validator.validateMatchesTrendsPeakLowest(stats, trends);
    },
  );
});
