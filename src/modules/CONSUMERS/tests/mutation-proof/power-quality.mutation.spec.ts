import { test, expect } from "@playwright/test";
import { PowerQualitySuccessResponseSchema } from "../../schemas/consumers.schemas";
import { samplePowerQualitySuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Power Quality", () => {
  test("MUT-CON-PQ-001 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(samplePowerQualitySuccess);
    (mutated as Record<string, unknown>).extra = 1;
    expect(PowerQualitySuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-PQ-002 — schema rejects success false", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    expect(PowerQualitySuccessResponseSchema.safeParse({ success: false, data: null }).success).toBe(false);
  });
  test("MUT-CON-PQ-003 — schema allows null data", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    expect(PowerQualitySuccessResponseSchema.safeParse({ success: true, data: null }).success).toBe(true);
  });
});
