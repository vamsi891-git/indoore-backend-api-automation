import { test, expect } from "@playwright/test";
import { FeederAlertsSuccessResponseSchema } from "../../schemas/feeder.schemas";
import { collectFeederDataQualityFindings } from "../../Db/feeder-db.validator";
import { sampleFeederAlertsSuccess } from "./fixtures/feeder-sample.fixture";

test.describe("Mutation proof — Feeder Alerts", () => {
  test(
    "MUT-FD-AL-001 — schema rejects missing rows",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederAlertsSuccess);
      delete (mutated.data as Record<string, unknown>).rows;
      expect(FeederAlertsSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-FD-AL-002 — schema rejects page = 0",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederAlertsSuccess);
      mutated.data.page = 0;
      expect(FeederAlertsSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-FD-AL-003 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederAlertsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(FeederAlertsSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-FD-AL-004 — data-quality flags blank meterNumber",
    { tag: ["@mutation-proof", "@feeder"] },
    async () => {
      const mutated = structuredClone(sampleFeederAlertsSuccess.data);
      mutated.rows[0].meterNumber = "";
      const report = collectFeederDataQualityFindings("alerts", mutated);
      expect(report.warnings.length + report.counts.emptyAlertMeter).toBeGreaterThan(
        0,
      );
    },
  );
});
