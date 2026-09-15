import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  BILLING_HISTORY_ARCHIVE_COUNT_SQL,
  CONSUMER_ACTIVATION_BY_REF_SQL,
  CONSUMER_CONNECTION_COUNT_SQL,
  CONSUMER_PROFILE_BY_REF_SQL,
  METER_BY_SERIAL_SQL,
  METER_LAST_SEEN_BY_LOOKUP_SQL,
  POWER_QUALITY_SP_LATEST_SQL,
  POWER_QUALITY_TP_LATEST_SQL,
  REALTIME_POWER_SP_LATEST_SQL,
  REALTIME_POWER_TP_LATEST_SQL,
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

export type DbMeterLastSeenRow = {
  lastSeen: Date | string | null;
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

export async function getMeterLastSeen(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<DbMeterLastSeenRow | null> {
  const rows = await queryReadOnly<DbMeterLastSeenRow>(
    pool,
    METER_LAST_SEEN_BY_LOOKUP_SQL,
    [meterLookupId],
  );
  return rows[0] ?? null;
}

/** Archive DB — billing history universe for one meter serial. */
export async function countBillingHistoryArchiveRows(
  archivePool: pg.Pool,
  meterSerial: string,
): Promise<number> {
  return (
    (await queryScalar<number>(
      archivePool,
      BILLING_HISTORY_ARCHIVE_COUNT_SQL,
      [meterSerial],
    )) ?? 0
  );
}

export type DbRealTimePowerRow = {
  rVoltage: number | string | null;
  rCurrent: number | string | null;
  rPowerFactor: number | string | null;
  yVoltage: number | string | null;
  yCurrent: number | string | null;
  yPowerFactor: number | string | null;
  bVoltage: number | string | null;
  bCurrent: number | string | null;
  bPowerFactor: number | string | null;
};

/** Primary DB — SP today IP cache for real-time-power. */
export async function getLatestSpRealTimePower(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<DbRealTimePowerRow | null> {
  const rows = await queryReadOnly<DbRealTimePowerRow>(
    pool,
    REALTIME_POWER_SP_LATEST_SQL,
    [meterLookupId],
  );
  return rows[0] ?? null;
}

/** Primary DB — TP today IP cache for real-time-power. */
export async function getLatestTpRealTimePower(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<DbRealTimePowerRow | null> {
  const rows = await queryReadOnly<DbRealTimePowerRow>(
    pool,
    REALTIME_POWER_TP_LATEST_SQL,
    [meterLookupId],
  );
  return rows[0] ?? null;
}

export type DbPowerQualityRow = {
  overallPf: number | string | null;
  frequency: number | string | null;
  neutralCurrent: number | string | null;
  mdKw: number | string | null;
  mdKva: number | string | null;
};

/** Primary DB — SP today IP cache for power-quality. */
export async function getLatestSpPowerQuality(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<DbPowerQualityRow | null> {
  const rows = await queryReadOnly<DbPowerQualityRow>(
    pool,
    POWER_QUALITY_SP_LATEST_SQL,
    [meterLookupId],
  );
  return rows[0] ?? null;
}

/** Primary DB — TP today IP cache for power-quality. */
export async function getLatestTpPowerQuality(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<DbPowerQualityRow | null> {
  const rows = await queryReadOnly<DbPowerQualityRow>(
    pool,
    POWER_QUALITY_TP_LATEST_SQL,
    [meterLookupId],
  );
  return rows[0] ?? null;
}
