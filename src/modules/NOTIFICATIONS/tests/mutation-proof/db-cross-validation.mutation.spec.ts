import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareNotificationsCountLteDb } from "../../Db/notifications-db-compare";

test.describe("Mutation proof — NOTIFICATIONS DB (fixture)", () => {
  test(
    "MUT-NOTIFI-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@notifications"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — notifications mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-NOTIFI-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@notifications"] },
    async () => {
      expect(() =>
        compareNotificationsCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
