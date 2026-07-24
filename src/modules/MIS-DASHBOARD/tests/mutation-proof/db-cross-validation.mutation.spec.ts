import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareMisDashboardCountLteDb } from "../../Db/mis-dashboard-db-compare";

test.describe("Mutation proof — MIS-DASHBOARD DB (fixture)", () => {
  test(
    "MUT-MIS-DA-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@mis-dashboard"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — mis-dashboard mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-MIS-DA-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@mis-dashboard"] },
    async () => {
      expect(() =>
        compareMisDashboardCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
