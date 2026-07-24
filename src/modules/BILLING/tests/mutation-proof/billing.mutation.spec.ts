import { test, expect } from "@playwright/test";
import {
  BillingDataResponseSchema,
  DaywiseBillingResponseSchema,
} from "../../schemas/billing.schemas";
import { collectBillingDataQualityFindings } from "../../Db/billing-db.validator";
import {
  sampleBillingDataSuccess,
  sampleDaywiseBillingSuccess,
} from "./fixtures/billing-sample.fixture";

test.describe("Mutation proof — Billing Data", () => {
  test(
    "MUT-BL-BD-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      const mutated = structuredClone(sampleBillingDataSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(BillingDataResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-BL-BD-002 — schema rejects empty meterNumber",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      const mutated = structuredClone(sampleBillingDataSuccess);
      mutated.data.rows[0].meterNumber = "";
      expect(BillingDataResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-BL-BD-003 — data-quality flags blank meterNumber",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      const mutated = structuredClone(sampleBillingDataSuccess.data);
      mutated.rows[0].meterNumber = "";
      const report = collectBillingDataQualityFindings(
        "billing-data",
        mutated as unknown as Record<string, unknown>,
      );
      expect(
        report.warnings.length + report.counts.emptyMeterNumber,
      ).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Daywise Billing", () => {
  test(
    "MUT-BL-DW-001 — schema rejects missing rows/items payload",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      const mutated = { success: true as const, data: { pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } };
      expect(DaywiseBillingResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-BL-DW-002 — schema rejects empty meterNumber",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      const mutated = structuredClone(sampleDaywiseBillingSuccess);
      mutated.data.rows[0].meterNumber = "";
      expect(DaywiseBillingResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-BL-DW-003 — data-quality flags blank meterNumber",
    { tag: ["@mutation-proof", "@billing"] },
    async () => {
      const mutated = structuredClone(sampleDaywiseBillingSuccess.data);
      mutated.rows[0].meterNumber = "";
      const report = collectBillingDataQualityFindings(
        "daywise-billing",
        mutated as unknown as Record<string, unknown>,
      );
      expect(
        report.warnings.length + report.counts.emptyMeterNumber,
      ).toBeGreaterThan(0);
    },
  );
});
