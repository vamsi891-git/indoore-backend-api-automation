import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareConsumptionCountLteDb } from "../../Db/consumption-db-compare";

test.describe("Mutation proof — CONSUMPTION DB (fixture)", () => {
  test(
    "MUT-CONSUM-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@consumption"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — consumption mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-CONSUM-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@consumption"] },
    async () => {
      expect(() =>
        compareConsumptionCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
