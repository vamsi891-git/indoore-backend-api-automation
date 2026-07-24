import { test, expect } from "@playwright/test";
import {
  ReportsSuccessResponseSchema,
  ReportsListSuccessResponseSchema,
} from "../../schemas/reports.schemas";
import { collectReportsDataQualityFindings } from "../../Db/reports-db.validator";
import { sampleReportsSuccess } from "./fixtures/reports-sample.fixture";

test.describe("Mutation proof — REPORTS", () => {
  test(
    "MUT-REPORT-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@reports"] },
    async () => {
      const mutated = structuredClone(sampleReportsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(ReportsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-REPORT-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@reports"] },
    async () => {
      const mutated = structuredClone(sampleReportsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(ReportsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-REPORT-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@reports"] },
    async () => {
      expect(ReportsListSuccessResponseSchema.safeParse(sampleReportsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-REPORT-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@reports"] },
    async () => {
      const mutated = structuredClone(sampleReportsSuccess.data);
      mutated.items[0].name = "";
      const report = collectReportsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
