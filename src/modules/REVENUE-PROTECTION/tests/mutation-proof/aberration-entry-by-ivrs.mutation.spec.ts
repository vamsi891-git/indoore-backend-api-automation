import { test, expect } from "@playwright/test";
import { AberrationEntryByIvrsSuccessResponseSchema } from "../../schemas/aberration-entry-by-ivrs.schemas";
import { sampleByIvrsSuccessResponse } from "./fixtures/by-ivrs-sample.fixture";
/**
 * Lightweight mutation proof — Aberration Entry By IVRS
 * PATCH /indore/revenue-protection/aberration-entry/:ivrsNo
 *
 * No pagination/columns grid — proves response envelope .strict() wiring.
 */
test.describe("Mutation proof — Aberration Entry By IVRS", () => {
  test("MUT-ABE-IVRS-001 — schema rejects unexpected data field (.strict())",
    {
      tag: [
        "@mutation-proof",
        "@revenue-protection",
        "@aberration-entry-by-ivrs",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleByIvrsSuccessResponse);
      (mutated.data as Record<string, unknown>).debugFlag = true;
      const result =
        AberrationEntryByIvrsSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );
  test("MUT-ABE-IVRS-002 — schema fails when ivrsNo is removed",
    {
      tag: [
        "@mutation-proof",
        "@revenue-protection",
        "@aberration-entry-by-ivrs",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleByIvrsSuccessResponse);
      delete (mutated.data as Record<string, unknown>).ivrsNo;
      const result =
        AberrationEntryByIvrsSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        const text = JSON.stringify(result.error.issues);
        expect(text).toMatch(/ivrsNo/);
        expect(text).toMatch(/invalid_type|required/i);
      }
    },
  );
  test("MUT-ABE-IVRS-003 — schema fails when ivrsNo is empty string",
    {
      tag: [
        "@mutation-proof",
        "@revenue-protection",
        "@aberration-entry-by-ivrs",
      ],
    },
    async () => {
      const mutated = structuredClone(sampleByIvrsSuccessResponse);
      mutated.data.ivrsNo = "";
      const result =
        AberrationEntryByIvrsSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/ivrsNo|too_small|min/i);
      }
    },
  );
});
