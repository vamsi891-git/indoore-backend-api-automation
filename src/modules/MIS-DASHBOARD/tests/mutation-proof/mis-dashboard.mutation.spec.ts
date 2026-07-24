import { test, expect } from "@playwright/test";
import {
  MisDashboardSuccessResponseSchema,
  MisDashboardListSuccessResponseSchema,
} from "../../schemas/mis-dashboard.schemas";
import { collectMisDashboardDataQualityFindings } from "../../Db/mis-dashboard-db.validator";
import { sampleMisDashboardSuccess } from "./fixtures/mis-dashboard-sample.fixture";

test.describe("Mutation proof — MIS-DASHBOARD", () => {
  test(
    "MUT-MIS-DA-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@mis-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleMisDashboardSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(MisDashboardSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-MIS-DA-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@mis-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleMisDashboardSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(MisDashboardSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-MIS-DA-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@mis-dashboard"] },
    async () => {
      expect(MisDashboardListSuccessResponseSchema.safeParse(sampleMisDashboardSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-MIS-DA-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@mis-dashboard"] },
    async () => {
      const mutated = structuredClone(sampleMisDashboardSuccess.data);
      mutated.items[0].name = "";
      const report = collectMisDashboardDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
