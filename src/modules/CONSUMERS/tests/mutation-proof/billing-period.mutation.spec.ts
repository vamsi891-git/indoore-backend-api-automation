import { test, expect } from "@playwright/test";
import { BillingPeriodSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleBillingPeriodSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Billing Period", () => {
  test("MUT-CON-BP-001 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleBillingPeriodSuccess);
    (mutated as Record<string, unknown>).extra = 1;
    expect(BillingPeriodSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-BP-002 — schema rejects success false envelope as true schema", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    expect(
      BillingPeriodSuccessResponseSchema.safeParse({ success: false, data: {} }).success,
    ).toBe(false);
  });
});
