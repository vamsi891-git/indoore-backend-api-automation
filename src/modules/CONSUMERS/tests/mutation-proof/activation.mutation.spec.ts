import { test, expect } from "@playwright/test";
import { ActivationSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleActivationSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Activation", () => {
  test("MUT-CON-ACT-001 — schema rejects missing consumer.name", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleActivationSuccess);
    delete (mutated.data.consumer as Record<string, unknown>).name;
    expect(ActivationSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-ACT-002 — schema rejects tblRefId = 0", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleActivationSuccess);
    mutated.data.consumer.tblRefId = 0;
    expect(ActivationSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
