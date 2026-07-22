import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";

/**
 * Mutation proof: compareApiToDb reports MISMATCH when API and DB values differ.
 * Uses fixture values only — no live database.
 *
 * Signature used (from db-compare.engine.ts):
 *   compareApiToDb(fields: DbCompareField[], title?, obs?)
 *   DbCompareField = { label, apiValue, dbValue, optional? }
 * Throws via Playwright expect when any required field mismatches.
 */
test.describe("Mutation proof — DB cross-validation mismatch", () => {
  test("MUT-005 — compareApiToDb fails when amountBilled API ≠ DB",
    { tag: ["@mutation-proof", "@revenue-protection"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [
            {
              label: "amountBilled",
              apiValue: 2800,
              dbValue: 1500,
            },
          ],
          "Mutation proof — amountBilled mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }

      expect(caught, "compareApiToDb should throw on field mismatch").toBeDefined();
      const message = caught?.message ?? "";
      expect(message).toMatch(/amountBilled/);
      expect(message).toMatch(/2800|1500|mismatch/i);
    },
  );
});
