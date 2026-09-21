import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../extras/db/db-compare.engine";
import { comparePowerQualityToDb, compareRealTimePowerToDb } from "../../Db/consumers-db.compare";

test.describe("Mutation proof — DB cross-validation (fixture)", () => {
  test(
    "MUT-CON-DB-001 — compareApiToDb fails when consumerName API ≠ DB",
    {
      tag: ["@mutation-proof", "@consumers"],
    },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "consumerName", apiValue: "ABC", dbValue: "XYZ" }],
          "Mutation proof — consumerName mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught).toBeDefined();
      expect(caught?.message ?? "").toMatch(/consumerName|ABC|XYZ|mismatch/i);
    },
  );

  test(
    "MUT-CON-DB-002 — real-time-power voltage mismatch fails",
    {
      tag: ["@mutation-proof", "@consumers"],
    },
    async () => {
      expect(() =>
        compareRealTimePowerToDb({
          api: {
            "R-Phase": {
              voltage: 230,
              current: 1,
              powerFactor: 0.9,
            },
            "Y-Phase": null,
            "B-Phase": null,
          },
          dbRow: {
            rVoltage: 240,
            rCurrent: 1,
            rPowerFactor: 0.9,
            yVoltage: null,
            yCurrent: null,
            yPowerFactor: null,
            bVoltage: null,
            bCurrent: null,
            bPowerFactor: null,
          },
          meterLookupId: 1,
          phaseKind: "SP",
        }),
      ).toThrow(/R\.voltage|mismatch/i);
    },
  );

  test(
    "MUT-CON-DB-003 — power-quality overallPf mismatch fails",
    {
      tag: ["@mutation-proof", "@consumers"],
    },
    async () => {
      expect(() =>
        comparePowerQualityToDb({
          api: {
            overallPf: { value: -0.08 },
            frequency: { value: 50.05 },
            neutralCurrent: { value: null },
            mdKw: { value: 0 },
            mdKva: { value: 0 },
          },
          dbRow: {
            overallPf: 0.96,
            frequency: 50.05,
            neutralCurrent: null,
            mdKw: 0,
            mdKva: 0,
          },
          meterLookupId: 1,
          phaseKind: "TP",
        }),
      ).toThrow(/overallPf|mismatch/i);
    },
  );
});
