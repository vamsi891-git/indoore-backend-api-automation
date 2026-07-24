import { test, expect } from "@playwright/test";
import {
  NotificationsSuccessResponseSchema,
  NotificationsListSuccessResponseSchema,
} from "../../schemas/notifications.schemas";
import { collectNotificationsDataQualityFindings } from "../../Db/notifications-db.validator";
import { sampleNotificationsSuccess } from "./fixtures/notifications-sample.fixture";

test.describe("Mutation proof — NOTIFICATIONS", () => {
  test(
    "MUT-NOTIFI-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@notifications"] },
    async () => {
      const mutated = structuredClone(sampleNotificationsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(NotificationsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-NOTIFI-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@notifications"] },
    async () => {
      const mutated = structuredClone(sampleNotificationsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(NotificationsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-NOTIFI-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@notifications"] },
    async () => {
      expect(NotificationsListSuccessResponseSchema.safeParse(sampleNotificationsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-NOTIFI-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@notifications"] },
    async () => {
      const mutated = structuredClone(sampleNotificationsSuccess.data);
      mutated.items[0].name = "";
      const report = collectNotificationsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
