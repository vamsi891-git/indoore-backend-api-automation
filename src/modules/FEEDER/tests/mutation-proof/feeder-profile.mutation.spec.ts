import { test, expect } from "@playwright/test";
import { FeederProfileSuccessResponseSchema } from "../../schemas/feeder.schemas";
import { collectFeederDataQualityFindings } from "../../Db/feeder-db.validator";
import { sampleFeederProfileSuccess } from "./fixtures/feeder-sample.fixture";

test.describe("Mutation proof — Feeder Profile", () => {
  test(
    "MUT-FD-PROF-001 — schema rejects missing feederCode",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederProfileSuccess);
      delete (mutated.data as Record<string, unknown>).feederCode;
      expect(FeederProfileSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-FD-PROF-002 — schema rejects unexpected root field (.strict())",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederProfileSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(FeederProfileSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-FD-PROF-003 — schema rejects empty feederCode",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederProfileSuccess);
      mutated.data.feederCode = "";
      expect(FeederProfileSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-FD-PROF-004 — data-quality flags blank feederCode",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederProfileSuccess.data);
      mutated.feederCode = "";
      const report = collectFeederDataQualityFindings("profile", mutated);
      expect(report.warnings.length + report.counts.emptyFeederCode).toBeGreaterThan(
        0,
      );
    },
  );
});
