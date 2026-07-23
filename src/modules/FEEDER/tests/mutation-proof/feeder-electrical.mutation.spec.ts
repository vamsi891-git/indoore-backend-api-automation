import { test, expect } from "@playwright/test";
import { FeederElectricalParametersSuccessResponseSchema } from "../../schemas/feeder.schemas";
import { collectFeederDataQualityFindings } from "../../Db/feeder-db.validator";
import { sampleFeederElectricalSuccess } from "./fixtures/feeder-sample.fixture";

test.describe("Mutation proof — Feeder Electrical Parameters", () => {
  test(
    "MUT-FD-EP-001 — schema rejects missing R-Phase",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederElectricalSuccess);
      delete (mutated.data as Record<string, unknown>)["R-Phase"];
      expect(
        FeederElectricalParametersSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-FD-EP-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederElectricalSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        FeederElectricalParametersSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-FD-EP-003 — data-quality flags blank meterSerialNumber",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederElectricalSuccess.data);
      mutated.meterSerialNumber = "";
      const report = collectFeederDataQualityFindings("electrical", mutated);
      expect(
        report.warnings.length + report.counts.emptyMeterSerial,
      ).toBeGreaterThan(0);
    },
  );
});
