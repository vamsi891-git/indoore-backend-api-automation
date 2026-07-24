import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  CONSUMER_MASTER_BY_LOOKUP_SQL,
  CONSUMER_MASTER_COUNT_SQL,
  DTR_CODE_EXISTS_SQL,
  DTR_MASTER_BY_LOOKUP_SQL,
  DTR_MASTER_COUNT_SQL,
  FEEDER_MASTER_BY_NAME_SQL,
  FEEDER_MASTER_COUNT_SQL,
  METER_ALREADY_ON_DTR_SQL,
  METER_COMMUNICATION_BY_SERIAL_SQL,
  METER_MASTER_BY_SERIAL_SQL,
  METER_MASTER_COUNT_SQL,
  METER_SERIAL_EXISTS_SQL,
  SUBSTATION_MASTER_BY_CODE_SQL,
  SUBSTATION_MASTER_COUNT_SQL,
} from "./master-data-sql";

/** Production default for DTR meters (`M_Meter_Type`); override via env. */
const DEFAULT_DTR_METER_TYPE_TBL_REF_ID = 2;

export function isMasterDataDbSqlReady(): boolean {
  return process.env.MASTER_DATA_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export function resolveDtrMeterTypeTblRefId(): number {
  const fromEnv = Number(process.env.DTR_METER_TYPE_TBL_REF_ID ?? "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return DEFAULT_DTR_METER_TYPE_TBL_REF_ID;
}

export type DbMeterRow = {
  meterLookupTblRefId: number;
  mf: number;
  meterSerialNumber: string | null;
  isActiveStatus?: boolean;
  networkLookupTblRefId?: number;
  organisationLookupTblRefId?: number;
};

export type DbDtrRow = {
  meterLookupTblRefId: number;
  dtr: string | null;
  dtrCode: string | null;
  feeder: string | null;
  subStation: string | null;
  zone: string | null;
  division: string | null;
  circle: string | null;
  meterSerialNumber: string | null;
  mf: string | null;
  latitude: string | null;
  longitude: string | null;
};

export type DbConsumerRow = {
  meterLookupTblRefId: number;
  meterSerialNumber: string | null;
  ivrsNo: string | null;
};

export type DbFeederRow = {
  feederName: string;
  substationName: string | null;
  zoneName: string | null;
  dtrCount: number;
  consumerCount: number;
};

export type DbSubstationRow = {
  substationName: string;
  substationCode: string | null;
  zoneName: string | null;
  dtrCount: number;
  consumerCount: number;
};

export type DbMeterCommunicationRow = {
  meterSerialNumber: string;
};

export async function countActiveMeters(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, METER_MASTER_COUNT_SQL)) ?? 0;
}

export async function getActiveMeterBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbMeterRow | null> {
  const rows = await queryReadOnly<DbMeterRow>(
    pool,
    METER_MASTER_BY_SERIAL_SQL,
    [serial],
  );
  return rows[0] ?? null;
}

export async function countDtrMasterRows(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DTR_MASTER_COUNT_SQL, [
      resolveDtrMeterTypeTblRefId(),
    ])) ?? 0
  );
}

export async function getDtrByMeterLookupId(
  pool: pg.Pool,
  meterLookupTblRefId: number,
): Promise<DbDtrRow | null> {
  const rows = await queryReadOnly<DbDtrRow>(
    pool,
    DTR_MASTER_BY_LOOKUP_SQL,
    [meterLookupTblRefId],
  );
  return rows[0] ?? null;
}

export async function countConsumerMasterRows(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, CONSUMER_MASTER_COUNT_SQL)) ?? 0;
}

export async function getConsumerByMeterLookupId(
  pool: pg.Pool,
  meterLookupTblRefId: number,
): Promise<DbConsumerRow | null> {
  const rows = await queryReadOnly<DbConsumerRow>(
    pool,
    CONSUMER_MASTER_BY_LOOKUP_SQL,
    [meterLookupTblRefId],
  );
  return rows[0] ?? null;
}

export async function countFeederMasterRows(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, FEEDER_MASTER_COUNT_SQL)) ?? 0;
}

export async function getFeederByName(
  pool: pg.Pool,
  feederName: string,
): Promise<DbFeederRow | null> {
  const rows = await queryReadOnly<DbFeederRow>(
    pool,
    FEEDER_MASTER_BY_NAME_SQL,
    [feederName],
  );
  return rows[0] ?? null;
}

export async function countSubstationMasterRows(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, SUBSTATION_MASTER_COUNT_SQL)) ?? 0;
}

export async function getSubstationByCode(
  pool: pg.Pool,
  substationCode: string,
): Promise<DbSubstationRow | null> {
  const rows = await queryReadOnly<DbSubstationRow>(
    pool,
    SUBSTATION_MASTER_BY_CODE_SQL,
    [substationCode],
  );
  return rows[0] ?? null;
}

export async function getMeterCommunicationBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbMeterCommunicationRow | null> {
  const rows = await queryReadOnly<DbMeterCommunicationRow>(
    pool,
    METER_COMMUNICATION_BY_SERIAL_SQL,
    [serial],
  );
  return rows[0] ?? null;
}

export async function meterSerialExistsInDb(
  pool: pg.Pool,
  serial: string,
): Promise<boolean> {
  const rows = await queryReadOnly<{ one: number }>(
    pool,
    METER_SERIAL_EXISTS_SQL,
    [serial.trim()],
  );
  return rows.length > 0;
}

export async function dtrCodeExistsInDb(
  pool: pg.Pool,
  dtrCode: string,
): Promise<boolean> {
  const rows = await queryReadOnly<{ ok: boolean }>(
    pool,
    DTR_CODE_EXISTS_SQL,
    [dtrCode],
  );
  return Boolean(rows[0]?.ok);
}

export async function isMeterAlreadyOnDtrInDb(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<boolean> {
  const rows = await queryReadOnly<{ ok: boolean }>(
    pool,
    METER_ALREADY_ON_DTR_SQL,
    [meterLookupId, resolveDtrMeterTypeTblRefId()],
  );
  return Boolean(rows[0]?.ok);
}
