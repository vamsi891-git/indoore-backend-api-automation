import { test, expect } from "@playwright/test";
import {
  DtrLoadUnbalanceSuccessResponseSchema,
  DtrVoltageUnbalanceSuccessResponseSchema,
} from "../../schemas/dashboard.schemas";
import { collectDashboardDataQualityFindings } from "../../Db/dashboard-db.validator";
import {
  sampleDtrLoadUnbalanceSuccess,
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
});
