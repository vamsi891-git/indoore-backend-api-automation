import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareCommericialAnalysisCountLteDb } from "../../Db/commericial-analysis-db-compare";

test.describe("Mutation proof — COMMERICIAL-ANALYSIS DB (fixture)", () => {
  test(
    "MUT-COMMER-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — commericial-analysis mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-COMMER-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(() =>
        compareCommericialAnalysisCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
