import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareModulesPermissionsCountLteDb } from "../../Db/modules-permissions-db-compare";

test.describe("Mutation proof — MODULES-PERMISSIONS DB (fixture)", () => {
  test(
    "MUT-MODULE-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@modules-permissions"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — modules-permissions mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-MODULE-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@modules-permissions"] },
    async () => {
      expect(() =>
        compareModulesPermissionsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
