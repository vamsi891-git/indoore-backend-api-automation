import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../extras/db/postgres.client";
import { AUDIT_LOG_BY_ID_SQL, AUDIT_LOGS_TOTAL_COUNT_SQL } from "./audit-logs-sql";

export function isAuditLogsDbSqlReady(): boolean {
  return process.env.AUDIT_LOGS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbAuditLogRow = {
  id: string;
  actorId: string;
  targetId: string | null;
  action: string;
  ipAddress: string | null;
  createdAt: Date | string;
  actorEmail: string | null;
};

export async function countAuditLogs(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, AUDIT_LOGS_TOTAL_COUNT_SQL)) ?? 0;
}

export async function getAuditLogById(pool: pg.Pool, id: string): Promise<DbAuditLogRow | null> {
  const rows = await queryReadOnly<DbAuditLogRow>(pool, AUDIT_LOG_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}
