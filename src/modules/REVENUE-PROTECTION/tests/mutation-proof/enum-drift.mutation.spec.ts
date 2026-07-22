import { test, expect } from "@playwright/test";
import {
  CaseStatusSchema,
  CasesSuccessResponseSchema,
} from "../../schemas/cases.schemas";
import { sampleCasesSuccessResponse } from "./fixtures/cases-sample.fixture";
/**
 * Mutation proof: status values outside the enum fail CaseStatusSchema /
 * CasesSuccessResponseSchema.
 */
test.describe("Mutation proof — enum drift", () => {
  test(
    "MUT-004 — CaseStatusSchema / full response reject status outside enum",
    { tag: ["@mutation-proof", "@revenue-protection"] },
    async () => {
      const drifted = "InProgress";

      const statusResult = CaseStatusSchema.safeParse(drifted);
      expect(statusResult.success).toBe(false);
      if (!statusResult.success) {
        const statusIssues = JSON.stringify(statusResult.error.issues);
        expect(statusIssues).toMatch(
          /InProgress|invalid_enum_value|invalid_value|Open|Resolved|Closed/i,
        );
      }
      const mutated = structuredClone(sampleCasesSuccessResponse);
      (mutated.data.rows[0] as { status: string }).status = drifted;

      const responseResult = CasesSuccessResponseSchema.safeParse(mutated);
      expect(responseResult.success).toBe(false);
      if (responseResult.success) {
        return;
      }
      const responseIssues = JSON.stringify(responseResult.error.issues);
      expect(responseIssues).toMatch(/status|InProgress|invalid_enum_value|invalid_value/i);
    },
  );
});
