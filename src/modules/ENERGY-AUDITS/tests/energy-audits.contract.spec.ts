import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { LossAnalysisStatsApi } from "../Api/loss-analysis-stats.api";
import { buildLossAnalysisStatsQuery } from "../Data/loss-analysis-stats.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("ENERGY-AUDITS — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Loss Analysis Stats Contract Snapshot",
    { tag: ["@contract-snapshot", "@energy-audits"] },
    async ({ authenticatedApi }) => {
      const query = buildLossAnalysisStatsQuery();
      const { responseBody, rawResponse } = await new LossAnalysisStatsApi(
        authenticatedApi,
      ).getLossAnalysisStats(query);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "energy-audits/loss-analysis-stats",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/energy-audit/loss-analysis-stats",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );
});
