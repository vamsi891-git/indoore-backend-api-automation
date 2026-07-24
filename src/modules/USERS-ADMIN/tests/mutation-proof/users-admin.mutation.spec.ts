import { test, expect } from "@playwright/test";
import {
  UsersAdminSuccessResponseSchema,
  UsersAdminListSuccessResponseSchema,
} from "../../schemas/users-admin.schemas";
import { collectUsersAdminDataQualityFindings } from "../../Db/users-admin-db.validator";
import { sampleUsersAdminSuccess } from "./fixtures/users-admin-sample.fixture";

test.describe("Mutation proof — USERS-ADMIN", () => {
  test(
    "MUT-USERS--001 — schema rejects success false",
    { tag: ["@mutation-proof", "@users-admin"] },
    async () => {
      const mutated = structuredClone(sampleUsersAdminSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(UsersAdminSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-USERS--002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@users-admin"] },
    async () => {
      const mutated = structuredClone(sampleUsersAdminSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(UsersAdminSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-USERS--003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@users-admin"] },
    async () => {
      expect(UsersAdminListSuccessResponseSchema.safeParse(sampleUsersAdminSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-USERS--004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@users-admin"] },
    async () => {
      const mutated = structuredClone(sampleUsersAdminSuccess.data);
      mutated.items[0].name = "";
      const report = collectUsersAdminDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
