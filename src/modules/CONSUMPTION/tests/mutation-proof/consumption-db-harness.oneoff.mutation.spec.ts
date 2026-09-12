import { test, expect } from "@playwright/test";
import {
  compareConsumptionConsumerSpotToDb,
  compareConsumptionCountLteDb,
} from "../../Db/consumption-db-compare";

/**
 * Throwaway proof — Consumption DB harness compares CAN fail.
 * Tag: @mutation-proof-oneoff (excluded from npm run test:consumption / mutation-proof).
 * Run explicitly only. Does not modify the real harness — fixture-only (MUT-005 style).
 *
 * NOTE: This test PASSES when a mismatch throws. That is intentional for proof.
 * Live DB coverage (IND-CON-DB-001) FAILs the suite when API > DB — do not confuse
 * the green ✓ here with a soft mismatch.
 */
test.describe("ONEOFF — Consumption DB harness can fail", () => {
  test(
    "ONEOFF-CON-DB-001 — identity spot-check throws on mismatched name",
    { tag: ["@mutation-proof-oneoff", "@consumption"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareConsumptionConsumerSpotToDb({
          api: {
            msn: "19272307",
            name: "Alice Consumer",
            ivrsNumber: "1234567",
            phase: "1Ph",
          },
          dbRow: {
            msn: "19272307",
            name: "WRONG_DB_NAME_MUTATION",
            ivrsNumber: "1234567",
            phase: "1Ph",
            meterLookupTblRefId: 1,
          },
        });
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }

      expect(caught, "spot-check must throw on identity mismatch").toBeDefined();
      const message = caught!.message;
      console.log("\n[ONEOFF] identity spot thrown message:\n", message);
      expect(message).toMatch(/name/i);
      expect(message).toMatch(/Alice Consumer|WRONG_DB_NAME_MUTATION|mismatch/i);
    },
  );

  test(
    "ONEOFF-CON-DB-002 — daily total ≤ DB throws when API exceeds DB",
    { tag: ["@mutation-proof-oneoff", "@consumption"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareConsumptionCountLteDb({
          label: "consumption.daily.total",
          apiCount: 500,
          dbCount: 10,
        });
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }

      expect(caught, "lte bound check must throw when API > DB").toBeDefined();
      const message = caught!.message;
      console.log("\n[ONEOFF] daily total ≤ DB thrown message:\n", message);
      expect(message).toMatch(/consumption\.daily\.total/);
      expect(message).toMatch(/exceeds/i);
      expect(message).toMatch(/500/);
      expect(message).toMatch(/10/);
    },
  );
});
