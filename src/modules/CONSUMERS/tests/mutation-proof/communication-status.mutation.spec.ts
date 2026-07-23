import { test, expect } from "@playwright/test";
import { CommunicationStatusSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleCommunicationStatusSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Communication Status", () => {
  test("MUT-CON-CS-001 — schema rejects missing intervals", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleCommunicationStatusSuccess);
    delete (mutated.data as Record<string, unknown>).intervals;
    expect(CommunicationStatusSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-CS-002 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleCommunicationStatusSuccess);
    (mutated as Record<string, unknown>).debug = 1;
    expect(CommunicationStatusSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-CS-003 — schema rejects date as number", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleCommunicationStatusSuccess);
    (mutated.data as Record<string, unknown>).date = 20260622;
    expect(CommunicationStatusSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
