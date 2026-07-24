import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareUsersProfileImageCountLteDb } from "../../Db/users-profile-image-db-compare";

test.describe("Mutation proof — USERS-PROFILE-IMAGE DB (fixture)", () => {
  test(
    "MUT-USERS--DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "@users-profile-image"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — users-profile-image mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-USERS--DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "@users-profile-image"] },
    async () => {
      expect(() =>
        compareUsersProfileImageCountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
