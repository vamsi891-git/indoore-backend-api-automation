import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareDashboardMetricMissingRow } from "../../Db/dashboard-db-compare";
import { DashboardDbValidator } from "../../Db/dashboard-db.validator";

test.describe("Mutation proof — DB cross-validation (fixture)", () => {
  test(
    "MUT-DB-DB-001 — compareApiToDb fails when dtr count API ≠ DB",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "networkDetails.dtrs", apiValue: 99, dbValue: 10 }],
          "Mutation proof — dtrs mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/dtrs|99|10|mismatch/i);
    },
  );

  test(
    "MUT-DB-DB-002 — assertApiLteDb fails when API exceeds DB",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      expect(() =>
        DashboardDbValidator.assertApiLteDb("dtrs", 50, 10),
      ).toThrow(/exceeds|50|10/i);
    },
  );

  test(
    "MUT-DB-DB-003 — missing row helper throws",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      expect(() => compareDashboardMetricMissingRow()).toThrow(
        /missing|L_Network_Lookup/i,
      );
    },
  );
});
