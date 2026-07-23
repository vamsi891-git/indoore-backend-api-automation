import { test, expect } from "@playwright/test";
import { ValidateMeterSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleValidateMeterSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Validate Meter", () => {
  test("MUT-CON-VM-001 — schema rejects missing valid", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleValidateMeterSuccess);
    delete (mutated.data as Record<string, unknown>).valid;
    expect(ValidateMeterSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-VM-002 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleValidateMeterSuccess);
    (mutated as Record<string, unknown>).extra = 1;
    expect(ValidateMeterSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-VM-003 — schema rejects meterLookupId = -1", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleValidateMeterSuccess);
    mutated.data.meterLookupId = -1;
    expect(ValidateMeterSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-VM-004 — schema rejects valid as string", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleValidateMeterSuccess);
    (mutated.data as Record<string, unknown>).valid = "yes";
    expect(ValidateMeterSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
