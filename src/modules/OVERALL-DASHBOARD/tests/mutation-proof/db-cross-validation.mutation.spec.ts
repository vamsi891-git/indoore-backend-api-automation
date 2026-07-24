import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareOdCountLteDb } from "../../Db/overall-dashboard-db-compare";

test.describe("Mutation proof — Overall Dashboard DB (fixture)", () => {
  test(
    "MUT-OD-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "dtrs", apiValue: 1, dbValue: 2 }],
          "Mutation proof — OD dtrs mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/dtrs|mismatch/i);
    },
  );

  test(
    "MUT-OD-DB-002 — lte fails when API > DB",
    { tag: ["@mutation-proof", "@overall-dashboard"] },
    async () => {
      expect(() =>
        compareOdCountLteDb({ label: "dtrs", apiCount: 99, dbCount: 1 }),
      ).toThrow(/exceeds|dtrs/i);
    },
  );
});
