import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareFeederProfileToDb } from "../../Db/feeder-db-compare";

test.describe("Mutation proof — DB cross-validation (fixture)", () => {
  test(
    "MUT-FD-DB-001 — compareApiToDb fails when feederCode API ≠ DB",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "feederCode", apiValue: "AAA", dbValue: "BBB" }],
          "Mutation proof — feederCode mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/feederCode|AAA|BBB|mismatch/i);
    },
  );

  test(
    "MUT-FD-DB-002 — compareFeederProfileToDb fails when DB row missing",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      expect(() =>
        compareFeederProfileToDb({
          api: { feederCode: "ZZZ", feederName: "X", status: "Active" },
          dbRow: null,
          lookupKey: "ZZZ",
        }),
      ).toThrow(/missing|L_Network_Lookup|lookup/i);
    },
  );
});
