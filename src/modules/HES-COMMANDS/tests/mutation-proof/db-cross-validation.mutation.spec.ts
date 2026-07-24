import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareHesCommandsCountLteDb } from "../../Db/hes-commands-db-compare";

test.describe("Mutation proof — HES-COMMANDS DB (fixture)", () => {
  test(
    "MUT-HES-CO-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@hes-commands"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — hes-commands mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-HES-CO-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@hes-commands"] },
    async () => {
      expect(() =>
        compareHesCommandsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
