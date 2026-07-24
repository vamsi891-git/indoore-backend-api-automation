import { test, expect } from "@playwright/test";
import {
  HesCommandsSuccessResponseSchema,
  HesCommandsListSuccessResponseSchema,
} from "../../schemas/hes-commands.schemas";
import { collectHesCommandsDataQualityFindings } from "../../Db/hes-commands-db.validator";
import { sampleHesCommandsSuccess } from "./fixtures/hes-commands-sample.fixture";

test.describe("Mutation proof — HES-COMMANDS", () => {
  test(
    "MUT-HES-CO-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@hes-commands"] },
    async () => {
      const mutated = structuredClone(sampleHesCommandsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(HesCommandsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-HES-CO-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@hes-commands"] },
    async () => {
      const mutated = structuredClone(sampleHesCommandsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(HesCommandsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-HES-CO-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@hes-commands"] },
    async () => {
      expect(HesCommandsListSuccessResponseSchema.safeParse(sampleHesCommandsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-HES-CO-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@hes-commands"] },
    async () => {
      const mutated = structuredClone(sampleHesCommandsSuccess.data);
      mutated.items[0].name = "";
      const report = collectHesCommandsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
