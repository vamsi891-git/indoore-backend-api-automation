import { test, expect } from "@playwright/test";
import {
  ConsumptionSuccessResponseSchema,
  ConsumptionListSuccessResponseSchema,
} from "../../schemas/consumption.schemas";
import { collectConsumptionDataQualityFindings } from "../../Db/consumption-db.validator";
import { sampleConsumptionSuccess } from "./fixtures/consumption-sample.fixture";

test.describe("Mutation proof — CONSUMPTION", () => {
  test(
    "MUT-CONSUM-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@consumption"] },
    async () => {
      const mutated = structuredClone(sampleConsumptionSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(ConsumptionSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-CONSUM-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@consumption"] },
    async () => {
      const mutated = structuredClone(sampleConsumptionSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(ConsumptionSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-CONSUM-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@consumption"] },
    async () => {
      expect(ConsumptionListSuccessResponseSchema.safeParse(sampleConsumptionSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-CONSUM-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@consumption"] },
    async () => {
      const mutated = structuredClone(sampleConsumptionSuccess.data);
      mutated.items[0].name = "";
      const report = collectConsumptionDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
