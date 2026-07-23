import { test, expect } from "@playwright/test";
import { EnergyFlowSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleEnergyFlowSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Energy Flow", () => {
  test("MUT-CON-EF-001 — schema rejects missing points", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEnergyFlowSuccess);
    delete (mutated.data as Record<string, unknown>).points;
    expect(EnergyFlowSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-EF-002 — schema rejects unexpected point field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEnergyFlowSuccess);
    (mutated.data.points[0] as Record<string, unknown>).extra = 1;
    expect(EnergyFlowSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-EF-003 — schema rejects kwhImport as string", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEnergyFlowSuccess);
    (mutated.data.points[0] as Record<string, unknown>).kwhImport = "abc";
    expect(EnergyFlowSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
