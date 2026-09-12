import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  DTRS_ACTIVE_DTR_COUNT_SQL,
  DTRS_BASE_BY_CODE_SQL,
  DTRS_FEEDER_ANCESTOR_COUNT_SQL,
} from "./dtrs-sql";

export function isDtrsDbSqlReady(): boolean {
  return process.env.DTRS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

const DEFAULT_DTR_METER_TYPE_TBL_REF_ID = 2;

export function resolveDtrMeterTypeTblRefId(): number {
  const fromEnv = Number(process.env.DTR_METER_TYPE_TBL_REF_ID ?? "");
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : DEFAULT_DTR_METER_TYPE_TBL_REF_ID;
}

export type DbDtrBaseRow = {
  networkLookupId: number;
  networkCode: string;
  networkName: string;
  networkAddress: string;
  circle: string | null;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  meterSerialNumber: string | null;
  mf: string | null;
};

export async function countActiveDtrs(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, DTRS_ACTIVE_DTR_COUNT_SQL)) ?? 0;
}

export async function getDtrBaseByCode(
  pool: pg.Pool,
  dtrCode: string,
  dtrMeterTypeId: number = resolveDtrMeterTypeTblRefId(),
): Promise<DbDtrBaseRow | null> {
  const rows = await queryReadOnly<DbDtrBaseRow>(pool, DTRS_BASE_BY_CODE_SQL, [
    dtrMeterTypeId,
    dtrCode,
  ]);
  return rows[0] ?? null;
}

export async function countDtrFeederAncestors(
  pool: pg.Pool,
  networkLookupId: number,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, DTRS_FEEDER_ANCESTOR_COUNT_SQL, [
      networkLookupId,
    ])) ?? 0
  );
}
