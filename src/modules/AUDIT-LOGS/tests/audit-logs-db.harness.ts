import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { logDbVsApiSection } from "../../../extras/db/db-compare.engine";
import { AuditLogsApi } from "../Api/auditlogs.api";
import { AuditLogsMapper } from "../Mapper/auditlogs.mapper";
import { compareAuditLogSpotToDb, compareAuditLogsCountLteDb } from "../Db/audit-logs-db-compare";
import { countAuditLogs, getAuditLogById } from "../Db/audit-logs.db";
import { logAuditLogsDataQualityFindings } from "../Db/audit-logs-db.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const SPOT_SAMPLE_SIZE = 3;

/**
 * Part 4 harness — aligned with AuditRepository.list (general.audit_logs).
 *
 * Export endpoint is a file download derived from the same list query —
 * intentionally not separately DB-checked (same row grain as list).
 * Display labels (actionLabel, actorLabel, detailsLines) are derived in
 * repository mapping — not compared to DB columns.
 */
export async function runAuditLogsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ApiValidationHelper();
  const api = new AuditLogsApi(authenticatedApi);
  const { rawResponse, responseBody } = await api.getAuditLogs({
    page: 1,
    limit: 20,
    sort: "createdAt_desc",
  });

  expect(rawResponse.status()).toBe(200);
  expect(responseBody.success).toBe(true);
  const mapped = AuditLogsMapper.mapData(responseBody.data);
  await logAuditLogsDataQualityFindings(
    "list",
    responseBody.data as unknown as Record<string, unknown>,
  );

  const dbCount = await countAuditLogs(db);
  logDbVsApiSection(
    "Audit logs list",
    {
      total: mapped.total,
      page: mapped.page,
      limit: mapped.limit,
      rowCount: mapped.logs.length,
    },
    { total: dbCount },
    { totalMode: "exact" },
  );

  validation.execute("Audit logs total equals audit_logs count", () => {
    expect(mapped.total).toBe(dbCount);
    compareAuditLogsCountLteDb({
      label: "audit-logs.total",
      apiCount: mapped.total,
      dbCount,
    });
  });

  expect(mapped.logs.length, "Audit logs page should include rows for spot checks").toBeGreaterThan(
    0,
  );

  for (const apiRow of mapped.logs.slice(0, SPOT_SAMPLE_SIZE)) {
    const dbRow = await getAuditLogById(db, apiRow.id);
    validation.execute(`Audit log spot vs DB (${apiRow.id})`, () => {
      expect(dbRow, `DB audit_logs row missing for id=${apiRow.id}`).toBeTruthy();
      compareAuditLogSpotToDb({
        api: {
          id: apiRow.id,
          actorId: apiRow.actorId,
          targetId: apiRow.targetId,
          action: apiRow.action,
          actorEmail: apiRow.actorEmail,
          createdAt: apiRow.createdAt,
          ipAddress: apiRow.ipAddress,
        },
        dbRow: dbRow!,
      });
    });
  }

  validation.printSummary("AUDIT-LOGS DB Coverage", 0);
}
