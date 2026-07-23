import { test, expect } from "@playwright/test";
import { ConsumerProfileSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { collectConsumersDataQualityFindings } from "../../Db/consumers-db.validator";
import { sampleConsumerProfileSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Consumer Profile", () => {
  test("MUT-CON-CP-001 — schema rejects missing consumerName", {
    tag: ["@mutation-proof", "@consumers"],
  }, async () => {
    const mutated = structuredClone(sampleConsumerProfileSuccess);
    delete (mutated.data as Record<string, unknown>).consumerName;
    expect(ConsumerProfileSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-CP-002 — schema rejects unexpected field (.strict())", {
    tag: ["@mutation-proof", "@consumers"],
  }, async () => {
    const mutated = structuredClone(sampleConsumerProfileSuccess);
    (mutated as Record<string, unknown>).extraField = true;
    expect(ConsumerProfileSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-CP-003 — schema rejects consumerName as number", {
    tag: ["@mutation-proof", "@consumers"],
  }, async () => {
    const mutated = structuredClone(sampleConsumerProfileSuccess);
    (mutated.data as Record<string, unknown>).consumerName = 100;
    expect(ConsumerProfileSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-CP-004 — schema rejects empty consumerName", {
    tag: ["@mutation-proof", "@consumers"],
  }, async () => {
    const mutated = structuredClone(sampleConsumerProfileSuccess);
    mutated.data.consumerName = "";
    expect(ConsumerProfileSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-CP-005 — data-quality flags blank meter serial", {
    tag: ["@mutation-proof", "@consumers"],
  }, async () => {
    const mutated = structuredClone(sampleConsumerProfileSuccess.data);
    mutated.meterSerialNumber = "";
    const report = collectConsumersDataQualityFindings("profile", mutated);
    expect(report.warnings.length + report.counts.emptyMeterSerial).toBeGreaterThan(0);
  });
});
