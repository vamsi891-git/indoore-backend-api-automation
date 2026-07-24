import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";

test.describe("Mutation proof — Billing DB cross-validation (fixture)", () => {
  test(
    "MUT-BL-DB-001 — compareApiToDb fails when meterNumber API ≠ DB",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "meterNumber", apiValue: "AAA", dbValue: "BBB" }],
          "Mutation proof — billing meter mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/meterNumber|AAA|BBB|mismatch/i);
    },
  );
});
