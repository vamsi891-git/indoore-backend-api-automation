import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareRolePermissionsCountLteDb } from "../../Db/role-permissions-db-compare";

test.describe("Mutation proof — ROLE-PERMISSIONS DB (fixture)", () => {
  test(
    "MUT-ROLE-P-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@role-permissions"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — role-permissions mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-ROLE-P-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@role-permissions"] },
    async () => {
      expect(() =>
        compareRolePermissionsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
