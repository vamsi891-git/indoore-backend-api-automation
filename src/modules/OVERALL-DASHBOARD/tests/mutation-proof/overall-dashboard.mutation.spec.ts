import { test, expect } from "@playwright/test";
import {
  OverallDashboardMetricsSuccessResponseSchema,
  OverallDtrCommunicationSuccessResponseSchema,
  InstallationSummarySuccessResponseSchema,
  DisconnectionDetailsSuccessResponseSchema,
} from "../../schemas/overall-dashboard.schemas";
import { collectOverallDashboardDataQualityFindings } from "../../Db/overall-dashboard-db.validator";
import {
  sampleOverallMetricsSuccess,
  sampleOverallDtrCommSuccess,
  sampleInstallationSummarySuccess,
  sampleDisconnectionDetailsSuccess,
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
    "MUT-OD-MET-003 — DQ flags blank installation label",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleOverallMetricsSuccess.data);
      mutated.installationSummary[0].label = "";
      const report = collectOverallDashboardDataQualityFindings(
        "metrics",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyLabel).toBeGreaterThan(
        0,
      );
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

test.describe("Mutation proof — Installation Summary", () => {
  test(
    "MUT-OD-INS-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleInstallationSummarySuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        InstallationSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-OD-INS-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleInstallationSummarySuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        InstallationSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});

test.describe("Mutation proof — Disconnection Details", () => {
  test(
    "MUT-OD-DIS-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDisconnectionDetailsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        DisconnectionDetailsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-OD-DIS-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDisconnectionDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DisconnectionDetailsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});
