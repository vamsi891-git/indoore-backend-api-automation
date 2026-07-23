import { test, expect } from "@playwright/test";
import { EventLogCardsSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { sampleEventLogCardsSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Event Log Cards", () => {
  test("MUT-CON-ELC-001 — schema rejects missing resolvedEvents", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogCardsSuccess);
    delete (mutated.data as Record<string, unknown>).resolvedEvents;
    expect(EventLogCardsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-ELC-002 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogCardsSuccess);
    (mutated as Record<string, unknown>).extra = true;
    expect(EventLogCardsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
});
