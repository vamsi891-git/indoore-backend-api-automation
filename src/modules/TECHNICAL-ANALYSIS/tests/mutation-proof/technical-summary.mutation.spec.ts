import { test, expect } from "@playwright/test";
import { TechnicalSummarySuccessResponseSchema } from "../../schemas/technical-analysis.schemas";
import { collectTechnicalAnalysisDataQualityFindings } from "../../Db/technical-analysis-db.validator";
import { sampleTechnicalSummarySuccess } from "./fixtures/technical-sample.fixture";

test.describe("Mutation proof — Technical Summary", () => {
  test(
    "MUT-TA-SUM-001 — schema rejects missing reports",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalSummarySuccess);
      delete (mutated.data as Record<string, unknown>).reports;
      expect(
        TechnicalSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-SUM-002 — schema rejects unexpected root field (.strict())",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalSummarySuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        TechnicalSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-SUM-003 — schema rejects month = 0",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalSummarySuccess);
      mutated.data.month = 0;
      expect(
        TechnicalSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-SUM-004 — schema rejects totalCount as string",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalSummarySuccess);
      (mutated.data.reports[0] as Record<string, unknown>).totalCount = "10";
      expect(
        TechnicalSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-SUM-005 — data-quality flags blank analysisType",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalSummarySuccess.data);
      mutated.reports[0].analysisType = "";
      const report = collectTechnicalAnalysisDataQualityFindings(
        "summary",
        mutated,
      );
      expect(report.warnings.length).toBeGreaterThan(0);
    },
  );
});
