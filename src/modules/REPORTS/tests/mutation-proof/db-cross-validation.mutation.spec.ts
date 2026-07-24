import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareReportsCountLteDb } from "../../Db/reports-db-compare";

test.describe("Mutation proof — REPORTS DB (fixture)", () => {
  test(
    "MUT-REPORT-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@reports"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — reports mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-REPORT-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@reports"] },
    async () => {
      expect(() =>
        compareReportsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
