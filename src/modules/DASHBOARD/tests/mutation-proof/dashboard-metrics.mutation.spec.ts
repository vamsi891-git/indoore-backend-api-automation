import { test, expect } from "@playwright/test";
import { DashboardMetricsSuccessResponseSchema } from "../../schemas/dashboard.schemas";
import { collectDashboardDataQualityFindings } from "../../Db/dashboard-db.validator";
import { sampleDashboardMetricsSuccess } from "./fixtures/dashboard-sample.fixture";

test.describe("Mutation proof — Dashboard Metrics", () => {
  test(
    "MUT-DB-MET-001 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDashboardMetricsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DashboardMetricsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-MET-002 — schema rejects success false",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDashboardMetricsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        DashboardMetricsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-MET-003 — data-quality flags blank network label",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDashboardMetricsSuccess.data);
      (mutated.networkDetails.dtrs as { label: string }).label = "";
      const report = collectDashboardDataQualityFindings("metrics", mutated);
      expect(
        report.warnings.length + report.counts.emptyNetworkLabel,
      ).toBeGreaterThan(0);
    },
  );
});
