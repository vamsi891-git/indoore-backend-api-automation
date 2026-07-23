import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  CONSUMER_ACTIVATION_BY_REF_SQL,
  CONSUMER_CONNECTION_COUNT_SQL,
  CONSUMER_PROFILE_BY_REF_SQL,
  METER_BY_SERIAL_SQL,
} from "./consumers-sql";

export function isConsumersDbSqlReady(): boolean {
  return process.env.CONSUMERS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export function resolveConsumersDbSampleSize(): number {
  const raw = Number(process.env.CONSUMERS_DB_SAMPLE_SIZE ?? "3");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
}

export type DbConsumerProfileRow = {
  consumerName: string;
  accountId: string;
  rrNumber: string;
  meterSerialNumber: string;
  consumerEmail: string;
  sanctionedLoadKw: number | string | null;
  meterLookupTblRefId: number;
};

export type DbConsumerActivationRow = {
  consumerTblRefId: number;
  accountId: string;
  rrNumber: string;
  consumerName: string;
  isActive: boolean;
};

export type DbMeterRow = {
  meterSerialNumber: string;
  meterLookupTblRefId: number;
  isActive: boolean;
  isAssigned: boolean;
};

export async function getConsumerProfileByRef(
  pool: pg.Pool,
  accountOrIvrs: string,
): Promise<DbConsumerProfileRow | null> {
  const rows = await queryReadOnly<DbConsumerProfileRow>(
    pool,
    CONSUMER_PROFILE_BY_REF_SQL,
    [accountOrIvrs],
  );
  return rows[0] ?? null;
}

/** @deprecated Prefer getConsumerProfileByRef */
export async function getConsumerProfileByAccount(
  pool: pg.Pool,
  accountOrId: string,
): Promise<DbConsumerProfileRow | null> {
  return getConsumerProfileByRef(pool, accountOrId);
}

export async function getConsumerActivationByRef(
  pool: pg.Pool,
  accountOrIvrs: string,
): Promise<DbConsumerActivationRow | null> {
  const rows = await queryReadOnly<DbConsumerActivationRow>(
    pool,
    CONSUMER_ACTIVATION_BY_REF_SQL,
    [accountOrIvrs],
  );
  return rows[0] ?? null;
}

export async function countConsumerAccounts(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, CONSUMER_CONNECTION_COUNT_SQL)) ?? 0;
}

export async function getMeterBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbMeterRow | null> {
  const rows = await queryReadOnly<DbMeterRow>(pool, METER_BY_SERIAL_SQL, [
    serial,
  ]);
  return rows[0] ?? null;
}
