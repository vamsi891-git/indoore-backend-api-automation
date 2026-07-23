import { test, expect } from "@playwright/test";
import {
  DtrSummarySuccessResponseSchema,
  DtrConsumptionSuccessResponseSchema,
  DtrCommunicationSuccessResponseSchema,
  DtrPowerStatusSuccessResponseSchema,
} from "../../schemas/dashboard.schemas";
import {
  sampleDtrSummarySuccess,
  sampleDtrConsumptionSuccess,
  sampleDtrCommunicationSuccess,
  sampleDtrPowerStatusSuccess,
} from "./fixtures/dashboard-sample.fixture";

test.describe("Mutation proof — DTR Dashboard widgets", () => {
  test(
    "MUT-DB-SUM-001 — summary schema rejects missing totalDtrs",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrSummarySuccess);
      delete (mutated.data as Record<string, unknown>).totalDtrs;
      expect(DtrSummarySuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-DB-SUM-002 — summary schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrSummarySuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(DtrSummarySuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-DB-CON-001 — consumption schema rejects missing points",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrConsumptionSuccess);
      delete (mutated.data as Record<string, unknown>).points;
      expect(
        DtrConsumptionSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-COM-001 — communication schema rejects invalid period",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrCommunicationSuccess);
      (mutated.data as Record<string, unknown>).period = "minute";
      expect(
        DtrCommunicationSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-DB-PWR-001 — power-status schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dashboard"] },
    async () => {
      const mutated = structuredClone(sampleDtrPowerStatusSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DtrPowerStatusSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});
