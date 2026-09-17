import { test, expect } from "@playwright/test";
import { AuditLogsValidator } from "../../Validator/auditlogs.validator";
import { AuditLogsListSuccessResponseSchema } from "../../schemas/audit-logs.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleAuditLogsSuccess } from "./fixtures/audit-logs-sample.fixture";
import type { AuditLogsData } from "../../Mapper/auditlogs.mapper";
import { AuditLogsMapper } from "../../Mapper/auditlogs.mapper";

test.describe("Mutation proof — AUDIT-LOGS", () => {
  test(
    "MUT-AUDIT-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        AuditLogsListSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-AUDIT-002 — schema rejects unexpected root field (.strict())",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      const result = AuditLogsListSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /extraField|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AUDIT-003 — schema rejects unexpected log field (.strict())",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      (mutated.data.logs[0] as Record<string, unknown>).debugFlag = true;
      const result = AuditLogsListSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AUDIT-004 — schema fails when actionLabel is removed",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      delete (mutated.data.logs[0] as Record<string, unknown>).actionLabel;
      const result = AuditLogsListSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/actionLabel/i);
      }
    },
  );

  test(
    "MUT-AUDIT-005 — schema rejects detailsLines as string",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const mutated = structuredClone(sampleAuditLogsSuccess);
      (mutated.data.logs[0] as Record<string, unknown>).detailsLines =
        "not-an-array";
      const result = AuditLogsListSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/detailsLines/i);
      }
    },
  );

  test(
    "MUT-AUDIT-006 — validateNextCursor fails when cursor drifts",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const data: AuditLogsData = AuditLogsMapper.mapData(
        structuredClone(sampleAuditLogsSuccess.data),
      );
      data.total = 40;
      data.totalPages = 2;
      data.nextCursor = "not-the-last-id";
      const message = captureThrownMessage(() =>
        new AuditLogsValidator().validateNextCursor(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/nextCursor|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AUDIT-007 — validateActorLabelMatchesName fails on mismatch",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const data: AuditLogsData = AuditLogsMapper.mapData(
        structuredClone(sampleAuditLogsSuccess.data),
      );
      data.logs[0].actorLabel = "Someone Else";
      const message = captureThrownMessage(() =>
        new AuditLogsValidator().validateActorLabelMatchesName(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/Someone Else|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AUDIT-008 — validateDisplayLabels fails when detailsLabel drifts",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const data: AuditLogsData = AuditLogsMapper.mapData(
        structuredClone(sampleAuditLogsSuccess.data),
      );
      data.logs[0].detailsLabel = "wrong";
      const message = captureThrownMessage(() =>
        new AuditLogsValidator().validateDisplayLabels(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/wrong|detailsLabel|expected|Received/i);
    },
  );

  test(
    "MUT-AUDIT-009 — validateActionFilter fails on mixed actions",
    { tag: ["@mutation-proof", "@audit-logs"] },
    async () => {
      const data: AuditLogsData = AuditLogsMapper.mapData(
        structuredClone(sampleAuditLogsSuccess.data),
      );
      const message = captureThrownMessage(() =>
        new AuditLogsValidator().validateActionFilter(data, "auth.logout"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/auth.logout|permissions|expected|Received/i);
    },
  );
});
