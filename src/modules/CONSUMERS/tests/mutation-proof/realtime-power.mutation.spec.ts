import { test, expect } from "@playwright/test";
import { RealTimePowerSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleRealTimePowerSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Real-Time Power", () => {
  test("MUT-CON-RTP-001 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleRealTimePowerSuccess);
    (mutated as Record<string, unknown>).extra = true;
    expect(RealTimePowerSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-RTP-002 — schema rejects success false", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    expect(RealTimePowerSuccessResponseSchema.safeParse({ success: false, data: {} }).success).toBe(false);
  });
  test("MUT-CON-RTP-003 — schema allows null data", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    expect(RealTimePowerSuccessResponseSchema.safeParse({ success: true, data: null }).success).toBe(true);
  });
});
