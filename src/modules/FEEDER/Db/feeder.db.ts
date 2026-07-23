import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  FEEDER_BY_CODE_SQL,
  FEEDER_CHILD_DTR_COUNT_SQL,
  FEEDER_METER_BY_SERIAL_SQL,
} from "./feeder-sql";

export function isFeederDbSqlReady(): boolean {
  return process.env.FEEDER_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export function resolveFeederDbSampleSize(): number {
  const raw = Number(process.env.FEEDER_DB_SAMPLE_SIZE ?? "3");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
}

export type DbFeederRow = {
  feederCode: string;
  feederName: string;
  isActive: boolean;
  networkLookupTblRefId: number;
};

export type DbFeederMeterRow = {
  meterSerialNumber: string;
  meterLookupTblRefId: number;
  isActive: boolean;
};

export async function getFeederByCode(
  pool: pg.Pool,
  feederCode: string,
): Promise<DbFeederRow | null> {
  const rows = await queryReadOnly<DbFeederRow>(pool, FEEDER_BY_CODE_SQL, [
    feederCode,
  ]);
  return rows[0] ?? null;
}

export async function countChildDtrsUnderFeeder(
  pool: pg.Pool,
  feederLookupId: number,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, FEEDER_CHILD_DTR_COUNT_SQL, [
      feederLookupId,
    ])) ?? 0
  );
}

export async function getFeederMeterBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbFeederMeterRow | null> {
  const rows = await queryReadOnly<DbFeederMeterRow>(
    pool,
    FEEDER_METER_BY_SERIAL_SQL,
    [serial],
  );
  return rows[0] ?? null;
}
