import { test, expect } from "@playwright/test";
import {
  AuditLogsSuccessResponseSchema,
  AuditLogsListSuccessResponseSchema,
} from "../../schemas/audit-logs.schemas";
import { collectAuditLogsDataQualityFindings } from "../../Db/audit-logs-db.validator";
import { sampleAuditLogsSuccess } from "./fixtures/audit-logs-sample.fixture";

test.describe("Mutation proof — AUDIT-LOGS", () => {
  test(
    "MUT-AUDIT--001 — schema rejects success false",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(AuditLogsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-AUDIT--002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(AuditLogsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-AUDIT--003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      expect(AuditLogsListSuccessResponseSchema.safeParse(sampleAuditLogsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-AUDIT--004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess.data);
      mutated.items[0].name = "";
      const report = collectAuditLogsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
