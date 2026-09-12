import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  REPORTS_ACTIVE_EVENT_COUNT_SQL,
  REPORTS_EVENT_BY_ID_SQL,
} from "./reports-sql";

export function isReportsDbSqlReady(): boolean {
  return process.env.REPORTS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbReportsEventRow = {
  eventId: number;
  eventName: string;
  isActive: boolean;
};

export async function countReportsActiveEvents(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, REPORTS_ACTIVE_EVENT_COUNT_SQL)) ?? 0;
}

export async function getReportsEventById(
  pool: pg.Pool,
  eventId: number,
): Promise<DbReportsEventRow | null> {
  const rows = await queryReadOnly<DbReportsEventRow>(
    pool,
    REPORTS_EVENT_BY_ID_SQL,
    [eventId],
  );
  return rows[0] ?? null;
}
