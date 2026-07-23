import { test, expect } from "@playwright/test";
import { LiveLoadProfileSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleLiveLoadProfileSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Live Load Profile", () => {
  test("MUT-CON-LLP-001 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleLiveLoadProfileSuccess);
    (mutated as Record<string, unknown>).extra = true;
    expect(LiveLoadProfileSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-LLP-002 — schema rejects meterPhase invalid enum", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleLiveLoadProfileSuccess);
    (mutated.data as Record<string, unknown>).meterPhase = "XX";
    expect(LiveLoadProfileSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
