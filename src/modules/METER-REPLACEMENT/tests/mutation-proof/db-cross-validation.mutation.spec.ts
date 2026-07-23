import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import {
  compareMrConsumerDetailToDb,
  compareMrDashboardOverallToDb,
  compareMrMeterValidationToDb,
  compareMrSubmissionDetailToDb,
} from "../../Db/meter-replacement-db-compare";

test.describe("Mutation proof — DB cross-validation (fixture)", () => {
  test(
    "MUT-MR-DB-001 — compareApiToDb fails when consumerId API ≠ DB",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "consumerId", apiValue: 1, dbValue: 2 }],
          "Mutation proof — consumerId mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/consumerId|mismatch/i);
    },
  );

  test(
    "MUT-MR-DB-002 — compareMrConsumerDetailToDb fails when DB row missing",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      expect(() =>
        compareMrConsumerDetailToDb({
          api: { consumerId: 999, consumer: "X" },
          dbRow: null,
          lookupKey: 999,
        }),
      ).toThrow(/missing|M_Consumer|lookup|master-consumer/i);
    },
  );

  test(
    "MUT-MR-DB-003 — compareMrMeterValidationToDb fails when DB row missing",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      expect(() =>
        compareMrMeterValidationToDb({
          api: { meterSerial: "NOPE", meterLookupId: 1, valid: true },
          dbRow: null,
        }),
      ).toThrow(/missing|L_Meter_Lookup|serial|findMeterForValidation/i);
    },
  );

  test(
    "MUT-MR-DB-004 — compareMrDashboardOverallToDb fails on KPI mismatch",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      expect(() =>
        compareMrDashboardOverallToDb({
          api: {
            totalMetersRequested: 10,
            totalMetersReplaced: 5,
            totalPendingMeters: 3,
            totalUnmappedMeters: 2,
          },
          dbRow: {
            totalMetersRequested: 99,
            totalMetersReplaced: 5,
            totalPendingMeters: 3,
            totalUnmappedMeters: 2,
          },
        }),
      ).toThrow(/totalMetersRequested|mismatch/i);
    },
  );

  test(
    "MUT-MR-DB-005 — compareMrSubmissionDetailToDb fails when DB row missing",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      expect(() =>
        compareMrSubmissionDetailToDb({
          api: { id: 1, status: "PENDING", consumerId: 1 },
          dbRow: null,
          lookupKey: 1,
        }),
      ).toThrow(/missing|meter_replacement/i);
    },
  );
});
