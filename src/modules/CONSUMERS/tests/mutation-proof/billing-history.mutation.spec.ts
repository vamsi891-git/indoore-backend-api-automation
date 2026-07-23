import { test, expect } from "@playwright/test";
import { BillingHistorySuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleBillingHistorySuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Billing History", () => {
  test("MUT-CON-BH-001 — schema rejects missing periodLabel", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleBillingHistorySuccess);
    delete (mutated.data[0] as Record<string, unknown>).periodLabel;
    expect(BillingHistorySuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-BH-002 — schema rejects unexpected row field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleBillingHistorySuccess);
    (mutated.data[0] as Record<string, unknown>).extra = true;
    expect(BillingHistorySuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-BH-003 — schema rejects billAmount as string", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleBillingHistorySuccess);
    (mutated.data[0] as Record<string, unknown>).billAmount = "abc";
    expect(BillingHistorySuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
