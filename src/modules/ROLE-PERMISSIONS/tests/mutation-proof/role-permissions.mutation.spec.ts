import { test, expect } from "@playwright/test";
import {
  RolePermissionsSuccessResponseSchema,
  RolePermissionsListSuccessResponseSchema,
} from "../../schemas/role-permissions.schemas";
import { collectRolePermissionsDataQualityFindings } from "../../Db/role-permissions-db.validator";
import { sampleRolePermissionsSuccess } from "./fixtures/role-permissions-sample.fixture";

test.describe("Mutation proof — ROLE-PERMISSIONS", () => {
  test(
    "MUT-ROLE-P-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@role-permissions"] },
    async () => {
      const mutated = structuredClone(sampleRolePermissionsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(RolePermissionsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-ROLE-P-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@role-permissions"] },
    async () => {
      const mutated = structuredClone(sampleRolePermissionsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(RolePermissionsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-ROLE-P-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@role-permissions"] },
    async () => {
      expect(RolePermissionsListSuccessResponseSchema.safeParse(sampleRolePermissionsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-ROLE-P-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@role-permissions"] },
    async () => {
      const mutated = structuredClone(sampleRolePermissionsSuccess.data);
      mutated.items[0].name = "";
      const report = collectRolePermissionsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
