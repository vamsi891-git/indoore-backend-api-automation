import { test, expect } from "@playwright/test";
import { CasesSuccessResponseSchema } from "../../schemas/cases.schemas";
import { sampleCasesSuccessResponse } from "./fixtures/cases-sample.fixture";

/**
 * Mutation proof: CaseRowSchema.strict() rejects unexpected keys.
 */
test.describe("Mutation proof — schema strict extra field", () => {
  test(
    "MUT-002 — CasesSuccessResponseSchema rejects unexpected row field",
    { tag: ["@mutation-proof", "@revenue-protection"] },
    async () => {
      const mutated = structuredClone(sampleCasesSuccessResponse);
      const row = mutated.data.rows[0] as Record<string, unknown>;
      row.debugFlag = true;
      const result = CasesSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }
      const issueText = JSON.stringify(result.error.issues);
      expect(issueText).toMatch(/debugFlag|unrecognized_keys|Unrecognized key/i);
    },
  );
});
