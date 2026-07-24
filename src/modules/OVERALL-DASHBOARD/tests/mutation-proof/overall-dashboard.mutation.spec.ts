import { test, expect } from "@playwright/test";
import {
  OverallDashboardMetricsSuccessResponseSchema,
  OverallDtrCommunicationSuccessResponseSchema,
} from "../../schemas/overall-dashboard.schemas";
import { collectOverallDashboardDataQualityFindings } from "../../Db/overall-dashboard-db.validator";
import {
  sampleOverallMetricsSuccess,
  sampleOverallDtrCommSuccess,
} from "./fixtures/overall-dashboard-sample.fixture";

test.describe("Mutation proof — Overall Dashboard Metrics", () => {
  test(
    "MUT-OD-MET-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleOverallMetricsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        OverallDashboardMetricsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-OD-MET-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleOverallMetricsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        OverallDashboardMetricsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-OD-MET-003 — DQ flags blank network label",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleOverallMetricsSuccess.data);
      (mutated.networkDetails.dtrs as { label: string }).label = "";
      const report = collectOverallDashboardDataQualityFindings("metrics", mutated);
      expect(report.warnings.length + report.counts.emptyLabel).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Overall DTR Communication", () => {
  test(
    "MUT-OD-COM-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleOverallDtrCommSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        OverallDtrCommunicationSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-OD-COM-002 — DQ flags blank point label",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleOverallDtrCommSuccess.data);
      mutated.points[0].label = "";
      const report = collectOverallDashboardDataQualityFindings(
        "dtr-communication",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyLabel).toBeGreaterThan(0);
    },
  );
});
