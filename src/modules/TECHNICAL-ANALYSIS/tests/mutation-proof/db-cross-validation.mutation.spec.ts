import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compareTechnicalReportRowToDb } from "../../Db/technical-analysis-db-compare";

test.describe("Mutation proof — DB cross-validation (fixture)", () => {
  test(
    "MUT-TA-DB-001 — compareApiToDb fails when msn API ≠ DB",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "msn", apiValue: "AAA", dbValue: "BBB" }],
          "Mutation proof — msn mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/msn|AAA|BBB|mismatch/i);
    },
  );

  test(
    "MUT-TA-DB-002 — compareTechnicalReportRowToDb fails when DB row missing",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      expect(() =>
        compareTechnicalReportRowToDb({
          api: {
            ivrsNumber: "N999",
            msn: "MSN-1",
            meterLookupId: 1,
            name: "X",
          },
          dbRow: null,
          lookupKey: "N999",
        }),
      ).toThrow(/missing|V_Consumerdetails|lookup/i);
    },
  );
});
