import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";

test.describe("Mutation proof — DB cross-validation (fixture)", () => {
  test("MUT-CON-DB-001 — compareApiToDb fails when consumerName API ≠ DB", {
    tag: ["@mutation-proof", "@consumers"],
  }, async () => {
    let caught: Error | undefined;
    try {
      compareApiToDb(
        [{ label: "consumerName", apiValue: "ABC", dbValue: "XYZ" }],
        "Mutation proof — consumerName mismatch",
      );
    } catch (error: unknown) {
      caught = error instanceof Error ? error : new Error(String(error));
    }
    expect(caught).toBeDefined();
    expect(caught?.message ?? "").toMatch(/consumerName|ABC|XYZ|mismatch/i);
  });
});
