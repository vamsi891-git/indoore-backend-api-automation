import { test, expect } from "@playwright/test";
import { EnergyConsumptionGraphSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleEnergyConsumptionGraphSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Energy Consumption Graph", () => {
  test("MUT-CON-ECG-001 — schema rejects missing period", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEnergyConsumptionGraphSuccess);
    delete (mutated.data as Record<string, unknown>).period;
    expect(EnergyConsumptionGraphSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-ECG-002 — schema rejects points = null", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEnergyConsumptionGraphSuccess);
    (mutated.data as Record<string, unknown>).points = null;
    expect(EnergyConsumptionGraphSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-ECG-003 — schema rejects consumptionKwh as string", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEnergyConsumptionGraphSuccess);
    (mutated.data.points[0] as Record<string, unknown>).consumptionKwh = "x";
    expect(EnergyConsumptionGraphSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
