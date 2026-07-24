import { test, expect } from "@playwright/test";
import {
  UsersProfileImageSuccessResponseSchema,
  UsersProfileImageListSuccessResponseSchema,
} from "../../schemas/users-profile-image.schemas";
import { collectUsersProfileImageDataQualityFindings } from "../../Db/users-profile-image-db.validator";
import { sampleUsersProfileImageSuccess } from "./fixtures/users-profile-image-sample.fixture";

test.describe("Mutation proof — USERS-PROFILE-IMAGE", () => {
  test(
    "MUT-USERS--001 — schema rejects success false",
    { tag: ["@mutation-proof", "@users-profile-image"] },
    async () => {
      const mutated = structuredClone(sampleUsersProfileImageSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(UsersProfileImageSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-USERS--002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@users-profile-image"] },
    async () => {
      const mutated = structuredClone(sampleUsersProfileImageSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(UsersProfileImageSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-USERS--003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@users-profile-image"] },
    async () => {
      expect(UsersProfileImageListSuccessResponseSchema.safeParse(sampleUsersProfileImageSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-USERS--004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@users-profile-image"] },
    async () => {
      const mutated = structuredClone(sampleUsersProfileImageSuccess.data);
      mutated.items[0].name = "";
      const report = collectUsersProfileImageDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
