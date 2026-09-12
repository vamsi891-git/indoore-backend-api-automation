import type pg from "pg";
import { queryReadOnly } from "../../../core/db/postgres.client";
import {
  NOTIFICATIONS_BY_ID_SQL,
  NOTIFICATIONS_USER_STATS_SQL,
} from "./notifications-sql";

export function isNotificationsDbSqlReady(): boolean {
  return process.env.NOTIFICATIONS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbNotificationStats = {
  total: number;
  unread: number;
  read: number;
};

export type DbNotificationRow = {
  id: string;
  userId: string;
  title: string;
  isRead: boolean;
  notificationType: string;
};

export async function getNotificationStatsForUser(
  pool: pg.Pool,
  userId: string,
): Promise<DbNotificationStats> {
  const rows = await queryReadOnly<DbNotificationStats>(
    pool,
    NOTIFICATIONS_USER_STATS_SQL,
    [userId],
  );
  return rows[0] ?? { total: 0, unread: 0, read: 0 };
}

export async function getNotificationByIdForUser(
  pool: pg.Pool,
  notificationId: string,
  userId: string,
): Promise<DbNotificationRow | null> {
  const rows = await queryReadOnly<DbNotificationRow>(
    pool,
    NOTIFICATIONS_BY_ID_SQL,
    [notificationId, userId],
  );
  return rows[0] ?? null;
}
