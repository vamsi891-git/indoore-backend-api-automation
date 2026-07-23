import { test, expect } from "@playwright/test";
import { FeederDailyConsumptionSuccessResponseSchema } from "../../schemas/feeder.schemas";
import { sampleFeederDailyConsumptionSuccess } from "./fixtures/feeder-sample.fixture";

test.describe("Mutation proof — Feeder Daily Consumption", () => {
  test(
    "MUT-FD-DC-001 — schema rejects missing points",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederDailyConsumptionSuccess);
      delete (mutated.data as Record<string, unknown>).points;
      expect(
        FeederDailyConsumptionSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-FD-DC-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederDailyConsumptionSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        FeederDailyConsumptionSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-FD-DC-003 — schema rejects invalid granularity",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederDailyConsumptionSuccess);
      (mutated.data as Record<string, unknown>).granularity = "hourly";
      expect(
        FeederDailyConsumptionSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});
