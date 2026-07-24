import type pg from "pg";
import { queryScalar } from "../../../core/db/postgres.client";
import {
  OD_ACTIVE_DTR_COUNT_SQL,
  OD_ACTIVE_FEEDER_COUNT_SQL,
  OD_ACTIVE_METER_COUNT_SQL,
  OD_ACTIVE_SUBSTATION_COUNT_SQL,
} from "./overall-dashboard-sql";

export function isOverallDashboardDbSqlReady(): boolean {
  return process.env.OVERALL_DASHBOARD_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export async function countOdActiveDtrs(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, OD_ACTIVE_DTR_COUNT_SQL)) ?? 0;
}
export async function countOdActiveFeeders(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, OD_ACTIVE_FEEDER_COUNT_SQL)) ?? 0;
}
export async function countOdActiveSubstations(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, OD_ACTIVE_SUBSTATION_COUNT_SQL)) ?? 0;
}
export async function countOdActiveMeters(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, OD_ACTIVE_METER_COUNT_SQL)) ?? 0;
}
