import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../extras/db/db-compare.engine";
import type { DbNotificationRow, DbNotificationStats } from "./notifications.db";

/**
 * Bound check used by mutation-proof — throws when API > DB.
 * Inbox totals are user-scoped exact; live harness uses compareNotificationStatsToDb.
 */
export function compareNotificationsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    `Notifications — ${options.label}`,
    {
      total: options.apiCount,
      page: 1,
      limit: 1,
      rowCount: 1,
    },
    { total: options.dbCount },
    { totalMode: "lte" },
  );

  if (options.apiCount > options.dbCount) {
    throw new Error(
      [
        `${options.label}: API exceeds DB universe`,
        `  API=${options.apiCount}`,
        `  DB=${options.dbCount}`,
      ].join("\n"),
    );
  }
}

export function compareNotificationStatsToDb(options: {
  api: { total: number; unread: number; read: number };
  db: DbNotificationStats;
  obs?: DbCompareObs;
}): void {
  const { api, db, obs } = options;
  compareApiToDb(
    [
      { label: "total", apiValue: api.total, dbValue: db.total },
      { label: "unread", apiValue: api.unread, dbValue: db.unread },
      { label: "read", apiValue: api.read, dbValue: db.read },
    ],
    "DB vs API — notification stats",
    obs,
  );
}

export function compareNotificationSpotToDb(options: {
  api: {
    id: string;
    title?: string | null;
    isRead?: boolean | null;
    notificationType?: string | null;
  };
  dbRow: DbNotificationRow | null;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB user_notifications row missing",
        `  id=${api.id}`,
        "  Hint: confirm general.user_notifications for JWT user.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      { label: "id", apiValue: api.id, dbValue: dbRow.id },
      {
        label: "title",
        apiValue: String(api.title ?? "").trim(),
        dbValue: String(dbRow.title ?? "").trim(),
      },
      {
        label: "isRead",
        apiValue: Boolean(api.isRead),
        dbValue: Boolean(dbRow.isRead),
      },
      {
        label: "notificationType",
        apiValue: String(api.notificationType ?? "").trim(),
        dbValue: String(dbRow.notificationType ?? "").trim(),
        optional: true,
      },
    ],
    `DB vs API — notification spot (${api.id})`,
    obs,
  );
}
