import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  CONSUMPTION_ACTIVE_CONSUMER_METER_COUNT_SQL,
  CONSUMPTION_ACTIVE_NET_METER_COUNT_SQL,
  CONSUMPTION_CONSUMER_BY_MSN_SQL,
  CONSUMPTION_DAILY_READING_AGG_SQL,
  CONSUMPTION_LIST_PAGE_KEY_COUNT_SQL,
} from "./consumption-sql";

export function isConsumptionDbSqlReady(): boolean {
  return process.env.CONSUMPTION_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbConsumptionConsumerRow = {
  name: string;
  ivrsNumber: string;
  msn: string;
  phase: string;
  meterLookupTblRefId: number;
};

export type DbConsumptionDailyReadingRow = {
  meterLookupTblRefId: number;
  minDate: Date | string | null;
  maxDate: Date | string | null;
  ir: number | string | null;
  fr: number | string | null;
};

export async function countConsumptionActiveConsumerMeters(
  pool: pg.Pool,
): Promise<number> {
  return (
    (await queryScalar<number>(
      pool,
      CONSUMPTION_ACTIVE_CONSUMER_METER_COUNT_SQL,
    )) ?? 0
  );
}

export async function countConsumptionActiveNetMeters(
  pool: pg.Pool,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, CONSUMPTION_ACTIVE_NET_METER_COUNT_SQL)) ??
    0
  );
}

/** Same grain as pattern/monthly `resolveConsumptionListTotal` (page-key FROM). */
export async function countConsumptionListPageKeys(
  pool: pg.Pool,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, CONSUMPTION_LIST_PAGE_KEY_COUNT_SQL)) ?? 0
  );
}

export async function getConsumptionConsumerByMsn(
  pool: pg.Pool,
  msn: string,
  ivrsNumber?: string | null,
): Promise<DbConsumptionConsumerRow | null> {
  const rows = await queryReadOnly<DbConsumptionConsumerRow>(
    pool,
    CONSUMPTION_CONSUMER_BY_MSN_SQL,
    [msn, ivrsNumber ?? ""],
  );
  return rows[0] ?? null;
}

/** Archive DB — daily IR/FR for one meter (T_DPData_CateSP). */
export async function getConsumptionDailyReadingAgg(
  archivePool: pg.Pool,
  meterLookupId: number,
  fromDate: string,
  toDate: string,
): Promise<DbConsumptionDailyReadingRow | null> {
  const rows = await queryReadOnly<DbConsumptionDailyReadingRow>(
    archivePool,
    CONSUMPTION_DAILY_READING_AGG_SQL,
    [meterLookupId, fromDate, toDate],
  );
  return rows[0] ?? null;
}
