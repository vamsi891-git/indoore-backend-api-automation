import { test, expect } from "@playwright/test";
import {
  ModulesPermissionsSuccessResponseSchema,
  ModulesPermissionsListSuccessResponseSchema,
} from "../../schemas/modules-permissions.schemas";
import { collectModulesPermissionsDataQualityFindings } from "../../Db/modules-permissions-db.validator";
import { sampleModulesPermissionsSuccess } from "./fixtures/modules-permissions-sample.fixture";

test.describe("Mutation proof — MODULES-PERMISSIONS", () => {
  test(
    "MUT-MODULE-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@modules-permissions"] },
    async () => {
      const mutated = structuredClone(sampleModulesPermissionsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(ModulesPermissionsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-MODULE-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@modules-permissions"] },
    async () => {
      const mutated = structuredClone(sampleModulesPermissionsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(ModulesPermissionsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-MODULE-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@modules-permissions"] },
    async () => {
      expect(ModulesPermissionsListSuccessResponseSchema.safeParse(sampleModulesPermissionsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-MODULE-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@modules-permissions"] },
    async () => {
      const mutated = structuredClone(sampleModulesPermissionsSuccess.data);
      mutated.items[0].name = "";
      const report = collectModulesPermissionsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
