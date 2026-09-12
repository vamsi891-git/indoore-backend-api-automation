import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type { DbAuditLogRow } from "./audit-logs.db";

export function compareAuditLogsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  // Exact match: API pagination total must equal DB count when records are compared.
  compareApiToDb(
    [
      {
        label: options.label,
        apiValue: options.apiCount,
        dbValue: options.dbCount,
      },
    ],
    `DB vs API - ${options.label}`,
    options.obs,
  );
}

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

export function compareAuditLogSpotToDb(options: {
  api: {
    id: string;
    actorId: string;
    targetId: string | null;
    action: string;
    actorEmail: string | null;
    createdAt: string;
    ipAddress: string | null;
  };
  dbRow: DbAuditLogRow;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  compareApiToDb(
    [
      { label: "id", apiValue: trimText(api.id), dbValue: trimText(dbRow.id) },
      {
        label: "actorId",
        apiValue: trimText(api.actorId),
        dbValue: trimText(dbRow.actorId),
      },
      {
        label: "targetId",
        apiValue: api.targetId == null ? null : trimText(api.targetId),
        dbValue: dbRow.targetId == null ? null : trimText(dbRow.targetId),
        optional: true,
      },
      {
        label: "action",
        apiValue: trimText(api.action),
        dbValue: trimText(dbRow.action),
      },
      {
        label: "actorEmail",
        apiValue: api.actorEmail == null ? null : trimText(api.actorEmail).toLowerCase(),
        dbValue:
          dbRow.actorEmail == null
            ? null
            : trimText(dbRow.actorEmail).toLowerCase(),
        optional: true,
      },
      {
        label: "createdAt",
        apiValue: toIso(api.createdAt),
        dbValue: toIso(dbRow.createdAt),
      },
      {
        label: "ipAddress",
        apiValue: api.ipAddress == null ? null : trimText(api.ipAddress),
        dbValue: dbRow.ipAddress == null ? null : trimText(dbRow.ipAddress),
        optional: true,
      },
    ],
    `DB vs API â€” audit log ${trimText(api.id)}`,
    obs,
  );
}
