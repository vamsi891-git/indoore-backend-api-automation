import type pg from "pg";
import { queryScalar } from "../../../core/db/postgres.client";
import {
  DASHBOARD_ACTIVE_DTR_COUNT_SQL,
  DASHBOARD_ACTIVE_FEEDER_COUNT_SQL,
  DASHBOARD_ACTIVE_METER_COUNT_SQL,
  DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL,
} from "./dashboard-sql";

export function isDashboardDbSqlReady(): boolean {
  return process.env.DASHBOARD_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export async function countActiveDtrs(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, DASHBOARD_ACTIVE_DTR_COUNT_SQL)) ?? 0;
}

export async function countActiveFeeders(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DASHBOARD_ACTIVE_FEEDER_COUNT_SQL)) ?? 0
  );
}

export async function countActiveSubstations(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL)) ??
    0
  );
}

export async function countActiveMeters(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DASHBOARD_ACTIVE_METER_COUNT_SQL)) ?? 0
  );
}
