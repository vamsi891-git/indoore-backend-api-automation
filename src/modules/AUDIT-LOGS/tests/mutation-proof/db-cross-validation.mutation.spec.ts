import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareAuditLogsCountLteDb } from "../../Db/audit-logs-db-compare";

test.describe("Mutation proof — AUDIT-LOGS DB (fixture)", () => {
  test(
    "MUT-AUDIT--DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — audit-logs mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-AUDIT--DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      expect(() =>
        compareAuditLogsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
