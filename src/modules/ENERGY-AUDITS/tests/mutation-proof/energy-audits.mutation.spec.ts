import { test, expect } from "@playwright/test";
import {
  EnergyAuditsSuccessResponseSchema,
  EnergyAuditsListSuccessResponseSchema,
} from "../../schemas/energy-audits.schemas";
import { collectEnergyAuditsDataQualityFindings } from "../../Db/energy-audits-db.validator";
import { sampleEnergyAuditsSuccess } from "./fixtures/energy-audits-sample.fixture";

test.describe("Mutation proof — ENERGY-AUDITS", () => {
  test(
    "MUT-ENERGY-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      const mutated = structuredClone(sampleEnergyAuditsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(EnergyAuditsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-ENERGY-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      const mutated = structuredClone(sampleEnergyAuditsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(EnergyAuditsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-ENERGY-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      expect(EnergyAuditsListSuccessResponseSchema.safeParse(sampleEnergyAuditsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-ENERGY-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      const mutated = structuredClone(sampleEnergyAuditsSuccess.data);
      mutated.items[0].name = "";
      const report = collectEnergyAuditsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
