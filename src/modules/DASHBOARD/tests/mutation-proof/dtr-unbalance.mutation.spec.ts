import { test, expect } from "@playwright/test";
import {
  ConsumerCategoryDistributionSuccessResponseSchema,
  ConsumerConnectionStatusSuccessResponseSchema,
  ConsumerPhaseDistributionSuccessResponseSchema,
  ConsumerOemDistributionSuccessResponseSchema,
  RevenueSubsidyPfSuccessResponseSchema,
  DtrCommunicationDetailsSuccessResponseSchema,
  DtrConsumptionDetailsSuccessResponseSchema,
  DtrLoadUnbalanceDetailsSuccessResponseSchema,
  DtrLoadUnbalanceSuccessResponseSchema,
  DtrPercentageLoadingDetailsSuccessResponseSchema,
  DtrPowerStatusDetailsSuccessResponseSchema,
  DtrVoltageUnbalanceDetailsSuccessResponseSchema,
  DtrVoltageUnbalanceSuccessResponseSchema,
} from "../../schemas/dashboard.schemas";
import { collectDashboardDataQualityFindings } from "../../Db/dashboard-db.validator";
import {
  sampleConsumerCategoryDistributionSuccess,
  sampleConsumerConnectionStatusSuccess,
  sampleConsumerPhaseDistributionSuccess,
  sampleConsumerOemDistributionSuccess,
  sampleRevenueSubsidyPfSuccess,
  sampleDtrCommunicationDetailsSuccess,
  sampleDtrConsumptionDetailsSuccess,
  sampleDtrLoadUnbalanceDetailsSuccess,
  sampleDtrLoadUnbalanceSuccess,
  sampleDtrPercentageLoadingDetailsSuccess,
  sampleDtrPowerStatusDetailsSuccess,
  sampleDtrVoltageUnbalanceDetailsSuccess,
  sampleDtrVoltageUnbalanceSuccess,
} from "./fixtures/dashboard-sample.fixture";

test.describe("Mutation proof — DTR Unbalance", () => {
  test(
    "MUT-DB-LU-001 — load-unbalance schema rejects missing items",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrLoadUnbalanceSuccess);
      delete (mutated.data as Record<string, unknown>).items;
      expect(
        DtrLoadUnbalanceSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-VU-001 — voltage-unbalance schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrVoltageUnbalanceSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrVoltageUnbalanceSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-LU-002 — data-quality flags blank unbalance label",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrLoadUnbalanceSuccess.data);
      mutated.items[0].label = "";
      const report = collectDashboardDataQualityFindings(
        "load-unbalance",
        mutated,
      );
      expect(
        report.warnings.length + report.counts.emptyUnbalanceLabel,
      ).toBeGreaterThan(0);
    },
  );

  test(
    "MUT-DB-LUD-001 — load-unbalance-details schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrLoadUnbalanceDetailsSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        DtrLoadUnbalanceDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-LUD-002 — load-unbalance-details schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrLoadUnbalanceDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrLoadUnbalanceDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-VUD-001 — voltage-unbalance-details schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrVoltageUnbalanceDetailsSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        DtrVoltageUnbalanceDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-VUD-002 — voltage-unbalance-details schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrVoltageUnbalanceDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrVoltageUnbalanceDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-PSD-001 — power-status-details schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrPowerStatusDetailsSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        DtrPowerStatusDetailsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-PSD-002 — power-status-details schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrPowerStatusDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrPowerStatusDetailsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CD-001 — communication-details schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrCommunicationDetailsSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        DtrCommunicationDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CD-002 — communication-details schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrCommunicationDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrCommunicationDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CONSD-001 — consumption-details schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrConsumptionDetailsSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        DtrConsumptionDetailsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CONSD-002 — consumption-details schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrConsumptionDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrConsumptionDetailsSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-PLD-001 — percentage-loading-details schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrPercentageLoadingDetailsSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        DtrPercentageLoadingDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-PLD-002 — percentage-loading-details schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrPercentageLoadingDetailsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrPercentageLoadingDetailsSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CCS-001 — connection-status schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerConnectionStatusSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        ConsumerConnectionStatusSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CCS-002 — connection-status schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerConnectionStatusSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        ConsumerConnectionStatusSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CCD-001 — category-distribution schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerCategoryDistributionSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        ConsumerCategoryDistributionSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CCD-002 — category-distribution schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerCategoryDistributionSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        ConsumerCategoryDistributionSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CPD-001 — phase-distribution schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerPhaseDistributionSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        ConsumerPhaseDistributionSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-CPD-002 — phase-distribution schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerPhaseDistributionSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        ConsumerPhaseDistributionSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-RSP-001 — revenue-subsidy-pf schema rejects missing billingAvailability",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleRevenueSubsidyPfSuccess);
      delete (mutated.data as Record<string, unknown>).billingAvailability;
      expect(
        RevenueSubsidyPfSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-RSP-002 — revenue-subsidy-pf schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleRevenueSubsidyPfSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        RevenueSubsidyPfSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-RSP-003 — revenue-subsidy-pf schema accepts null avgImprovement",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleRevenueSubsidyPfSuccess);
      mutated.data.avgImprovement = null;
      mutated.data.billCount = 0;
      expect(
        RevenueSubsidyPfSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(true);
    },
  );

  test(
    "MUT-DB-COD-001 — oem-distribution schema rejects missing pagination",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerOemDistributionSuccess);
      delete (mutated.data as Record<string, unknown>).pagination;
      expect(
        ConsumerOemDistributionSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-COD-002 — oem-distribution schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleConsumerOemDistributionSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        ConsumerOemDistributionSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );
});
