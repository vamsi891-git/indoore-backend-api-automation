import { test, expect } from "@playwright/test";
import {
  CommericialAnalysisSuccessResponseSchema,
  CommericialAnalysisListSuccessResponseSchema,
} from "../../schemas/commericial-analysis.schemas";
import { collectCommericialAnalysisDataQualityFindings } from "../../Db/commericial-analysis-db.validator";
import { sampleCommericialAnalysisSuccess } from "./fixtures/commericial-analysis-sample.fixture";

test.describe("Mutation proof — COMMERICIAL-ANALYSIS", () => {
  test(
    "MUT-COMMER-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const mutated = structuredClone(sampleCommericialAnalysisSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(CommericialAnalysisSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-COMMER-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const mutated = structuredClone(sampleCommericialAnalysisSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(CommericialAnalysisSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-COMMER-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(CommericialAnalysisListSuccessResponseSchema.safeParse(sampleCommericialAnalysisSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-COMMER-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const mutated = structuredClone(sampleCommericialAnalysisSuccess.data);
      mutated.items[0].name = "";
      const report = collectCommericialAnalysisDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
