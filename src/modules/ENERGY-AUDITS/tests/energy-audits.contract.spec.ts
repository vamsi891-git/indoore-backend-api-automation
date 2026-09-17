import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { HourlyLossReportApi } from "../Api/hourly-loss-report.api";
import { LossAnalysisApi } from "../Api/loss-analysis.api";
import { LossAnalysisStatsApi } from "../Api/loss-analysis-stats.api";
import { LossAnalysisTrendsApi } from "../Api/loss-analysis-trends.api";
import { NetworkTrendsApi } from "../Api/network-trends.api";
import { buildDtrHourlyLossReportQuery } from "../Data/hourly-loss-report.data";
import { buildLossAnalysisQuery, dtrNetworkLookupId } from "../Data/loss-analysis.data";
import { buildLossAnalysisStatsQuery } from "../Data/loss-analysis-stats.data";
import { buildLossAnalysisTrendsQuery } from "../Data/loss-analysis-trends.data";
import { buildNetworkTrendsQuery } from "../Data/network-trends.data";

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

  test(
    "Loss Analysis Grid Contract Snapshot",
    { tag: ["@contract-snapshot", "@energy-audits", "@loss-analysis"] },
    async ({ authenticatedApi }) => {
      const query = buildLossAnalysisQuery("billing", "dtr", dtrNetworkLookupId);
      const { responseBody, rawResponse } = await new LossAnalysisApi(
        authenticatedApi,
      ).getLossAnalysis(query);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const columns = Array.isArray(data.columns) ? data.columns : [];
      const rowKeys =
        rows.length > 0 ? Object.keys(asRecord(rows[0])) : ["rows"];
      const columnKeys =
        columns.length > 0 ? Object.keys(asRecord(columns[0])) : ["columns"];

      await assertContractSnapshot(
        "energy-audits/loss-analysis",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/energy-audit/loss-analysis",
          dataKeys: Object.keys(data).sort(),
          itemKeys: [...new Set([...rowKeys, ...columnKeys])].sort(),
        }),
      );
    },
  );

  test(
    "Hourly Loss Report Contract Snapshot",
    { tag: ["@contract-snapshot", "@energy-audits", "@hourly-loss-report"] },
    async ({ authenticatedApi }) => {
      const query = buildDtrHourlyLossReportQuery();
      const { responseBody, rawResponse } = await new HourlyLossReportApi(
        authenticatedApi,
      ).getHourlyLossReport(query);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const rowKeys =
        rows.length > 0 ? Object.keys(asRecord(rows[0])) : ["rows"];

      await assertContractSnapshot(
        "energy-audits/hourly-loss-report",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/energy-audit/hourly-loss-report",
          dataKeys: Object.keys(data).sort(),
          itemKeys: rowKeys.sort(),
        }),
      );
    },
  );

  test(
    "Loss Analysis Trends Contract Snapshot",
    { tag: ["@contract-snapshot", "@energy-audits", "@loss-analysis-trends"] },
    async ({ authenticatedApi }) => {
      const query = buildLossAnalysisTrendsQuery();
      const { responseBody, rawResponse } = await new LossAnalysisTrendsApi(
        authenticatedApi,
      ).getLossAnalysisTrends(query);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const items = Array.isArray(data.items) ? data.items : [];
      const itemKeys =
        items.length > 0 ? Object.keys(asRecord(items[0])) : ["items"];

      await assertContractSnapshot(
        "energy-audits/loss-analysis-trends",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/energy-audit/loss-analysis-trends",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeys.sort(),
        }),
      );
    },
  );

  test(
    "Network Trends Contract Snapshot",
    { tag: ["@contract-snapshot", "@energy-audits", "@network-trends"] },
    async ({ authenticatedApi }) => {
      const query = buildNetworkTrendsQuery("billing");
      const { responseBody, rawResponse } = await new NetworkTrendsApi(
        authenticatedApi,
      ).getNetworkTrends(query);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const items = Array.isArray(data.items) ? data.items : [];
      const itemKeys =
        items.length > 0 ? Object.keys(asRecord(items[0])) : ["items"];

      await assertContractSnapshot(
        "energy-audits/network-trends",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/energy-audit/network-trends",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeys.sort(),
        }),
      );
    },
  );
});
