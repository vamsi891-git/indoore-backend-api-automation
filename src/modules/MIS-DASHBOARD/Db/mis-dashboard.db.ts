import type pg from "pg";
import { queryReadOnly } from "../../../extras/db/postgres.client";
import { MIS_COMM_STATS_UNSCOPED_SQL } from "./mis-dashboard-sql";

export function isMisDashboardDbSqlReady(): boolean {
  return process.env.MIS_DASHBOARD_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbMisCommStatsRow = {
  total: number;
  active: number;
  nonOperational: number;
  unmapped: number;
};

export async function getMisCommStatsUnscoped(pool: pg.Pool): Promise<DbMisCommStatsRow> {
  const rows = await queryReadOnly<DbMisCommStatsRow>(pool, MIS_COMM_STATS_UNSCOPED_SQL);
  return (
    rows[0] ?? {
      total: 0,
      active: 0,
      nonOperational: 0,
      unmapped: 0,
    }
  );
}
