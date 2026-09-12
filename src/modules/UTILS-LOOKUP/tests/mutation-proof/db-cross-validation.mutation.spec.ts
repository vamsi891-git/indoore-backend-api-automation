import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";

test.describe("Mutation proof — Utils Lookup DB cross-validation (fixture)", () => {
  test(
    "MUT-UL-DB-001 — compareApiToDb fails when catalog id API ≠ DB",
    { tag: ["@mutation-proof", "@utils-lookup"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "id", apiValue: "AAA", dbValue: "BBB" }],
          "Mutation proof — utils-lookup catalog mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/id|AAA|BBB|mismatch/i);
    },
  );
});
