import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { collectDtrDetailDataQualityFindings } from "../../Db/asset-management-db.validator";
import { sampleDtrDetailSuccess } from "./fixtures/asset-sample.fixture";

/**
 * Mutation proof: compareApiToDb throws when API and DB values differ.
 * Fixture-only — no live database.
 */
test.describe("Mutation proof — DB cross-validation mismatch", () => {
  test(
    "MUT-AM-DB-001 — compareApiToDb fails when consumer count API ≠ DB",
    { tag: ["@mutation-proof", "@asset-management"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [
            {
              label: "dtr.consumerCount",
              apiValue: 12,
              dbValue: 7,
            },
          ],
          "Mutation proof — consumerCount mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }

      expect(
        caught,
        "compareApiToDb should throw on field mismatch",
      ).toBeDefined();
      const message = caught?.message ?? "";
      expect(message).toMatch(/consumerCount/i);
      expect(message).toMatch(/12|7|mismatch/i);
    },
  );

  test(
    "MUT-AM-DB-002 — data-quality collector reports empty accountId",
    { tag: ["@mutation-proof", "@asset-management"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess.data);
      mutated.consumers[0].accountId = "";
      const report = collectDtrDetailDataQualityFindings(mutated);
      expect(report.counts.emptyAccountId).toBeGreaterThan(0);
      expect(
        report.warnings.some((warning) =>
          /ACCOUNT|accountId/i.test(`${warning.code} ${warning.message}`),
        ),
      ).toBe(true);
    },
  );
});
