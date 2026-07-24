import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareAuthCountLteDb } from "../../Db/auth-db-compare";

test.describe("Mutation proof — AUTH DB (fixture)", () => {
  test(
    "MUT-AUTH-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@auth"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — auth mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-AUTH-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@auth"] },
    async () => {
      expect(() =>
        compareAuthCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
