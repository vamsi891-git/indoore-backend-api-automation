/**
 * TECHNICAL-ANALYSIS contract snapshots — structural only.
 * Do NOT snapshot live counts / IVRS / durations — those drift every run.
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:technical-analysis:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { TechnicalSummaryApi } from "../Api/technical-summary.api";
import { TechnicalReportApi } from "../Api/technicalanalysis.api";
import { resolveTechnicalSummaryQuery } from "../Data/technical-summary.data";
import {
  resolveTechnicalReportQuery,
  technicalAnalysisDefaultAnalysisType,
  technicalAnalysisLiveConfigs,
} from "../Data/technicalanalysis.data";
import { isTechnicalGridData } from "../Mapper/technicalanalysis.mapper";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("TECHNICAL-ANALYSIS — Contract Snapshots", () => {
  test.setTimeout(600_000);

  test(
    "Technical Summary Contract Snapshot",
    { tag: ["@contract-snapshot", "@technical-analysis", "@technical-summary"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new TechnicalSummaryApi(
        authenticatedApi,
      ).getTechnicalSummary(resolveTechnicalSummaryQuery("dev_live_primary"));
      expect(responseBody.success).toBe(true);

      const data = asRecord(responseBody.data);
      const reports = Array.isArray(data.reports) ? data.reports : [];
      const itemKeys =
        reports.length > 0 ? Object.keys(asRecord(reports[0])) : [];

      await assertContractSnapshot(
        "technical-analysis/technical-summary",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/analysis/technical/summary",
          dataKeys: Object.keys(data),
          itemKeys,
        }),
      );
    },
  );

  test(
    "Technical Report Contract Snapshot",
    { tag: ["@contract-snapshot", "@technical-analysis", "@report"] },
    async ({ authenticatedApi }) => {
      const liveConfig =
        technicalAnalysisLiveConfigs.find(
          (c) =>
            c.analysisType === technicalAnalysisDefaultAnalysisType &&
            c.hasData,
        ) ?? technicalAnalysisLiveConfigs.find((c) => c.hasData);

      const { responseBody } = await new TechnicalReportApi(
        authenticatedApi,
      ).getTechnicalReport(
        resolveTechnicalReportQuery("dev_live_report", liveConfig),
      );
      expect(responseBody.success).toBe(true);

      const data = responseBody.data;
      expect(isTechnicalGridData(data)).toBe(true);
      if (!isTechnicalGridData(data)) {
        return;
      }

      const rowKeys =
        data.rows.length > 0 ? Object.keys(asRecord(data.rows[0])) : [];
      const columns = (data.columns ?? []).map((c) => ({
        key: c.key,
        header: c.header,
      }));

      await assertContractSnapshot(
        "technical-analysis/technical-report",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/analysis/technical/report",
          dataKeys: Object.keys(asRecord(data)),
          itemKeys: rowKeys,
          hasColumnsGrid: columns.length > 0,
          columns,
        }),
      );
    },
  );
});
