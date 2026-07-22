import { test, expect } from "@playwright/test";
import { CasesSuccessResponseSchema } from "../../schemas/cases.schemas";
import { sampleCasesSuccessResponse } from "./fixtures/cases-sample.fixture";
/**
 * Mutation proof: removing a required row field fails schema validation.
 */
test.describe("Mutation proof — schema missing required field", () => {
  test("MUT-003 — CasesSuccessResponseSchema fails when amountBilled is removed",
    { tag: ["@mutation-proof", "@revenue-protection"] },
    async () => {
      const mutated = structuredClone(sampleCasesSuccessResponse);
      const row = mutated.data.rows[0] as Record<string, unknown>;
      delete row.amountBilled;
      const result = CasesSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }
      const issueText = JSON.stringify(result.error.issues);
      expect(issueText).toMatch(/amountBilled/);
      expect(issueText).toMatch(/invalid_type|Required|required/i);
    },
  );
});
