import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareEnergyAuditsCountLteDb } from "../../Db/energy-audits-db-compare";

test.describe("Mutation proof — ENERGY-AUDITS DB (fixture)", () => {
  test(
    "MUT-ENERGY-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — energy-audits mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-ENERGY-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      expect(() =>
        compareEnergyAuditsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
