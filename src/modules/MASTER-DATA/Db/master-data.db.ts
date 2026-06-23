import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  DTR_MASTER_COUNT_SQL,
  FEEDER_MASTER_COUNT_SQL,
  SUBSTATION_MASTER_COUNT_SQL,
} from "./master-data-sql";

export type DbMeterRow = {
  meterLookupTblRefId: number;
  mf: number;
  meterSerialNumber: string;
};

/** Active meters in L_Meter_Lookup — aligns with listMeterMasterDataFromLookup default scope. */
export async function countActiveMeters(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(
      pool,
      `SELECT COUNT(*)::int AS total
       FROM public."L_Meter_Lookup"
       WHERE "IsActiveStatus" = TRUE`,
    )) ?? 0
  );
}

export async function getActiveMeterBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbMeterRow | null> {
  const rows = await queryReadOnly<DbMeterRow>(
    pool,
    `SELECT lml."MeterLookup_TblRefID" AS "meterLookupTblRefId",
            mm."MF" AS mf,
            lml."Meter_Serial_Number" AS "meterSerialNumber"
     FROM public."L_Meter_Lookup" lml
     INNER JOIN public."M_Meter" mm
       ON mm."Meter_TblRefID" = lml."Meter_TblRefID"
     WHERE lml."Meter_Serial_Number" = $1
       AND lml."IsActiveStatus" = TRUE
     LIMIT 1`,
    [serial],
  );
  return rows[0] ?? null;
}

/** DTR master default list — distinct active DTR networks with service-point meter. */
export async function countDtrMasterRows(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, DTR_MASTER_COUNT_SQL)) ?? 0;
}

/**
 * Consumer master default list — active meters with a consumer service point
 * (backend listConsumerMasterDataFromView / meterType=all, no text filter).
 * API may differ when JWT org/network scope is narrower than full DB.
 */
export async function countConsumerMasterRows(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(
      pool,
      `SELECT COUNT(DISTINCT lml."MeterLookup_TblRefID")::int AS total
       FROM public."L_Meter_Lookup" lml
       INNER JOIN public."M_Consumer_Connection_ServicePoint" sp
         ON sp."MeterLookup_TblRefID" = lml."MeterLookup_TblRefID"
       INNER JOIN public."M_Consumer_Connection" mcc
         ON mcc."ConsumerConnection_TblRefID" = sp."ConsumerConnection_TblRefID"
       WHERE lml."IsActiveStatus" = TRUE`,
    )) ?? 0
  );
}

/** Active feeder networks — backend listFeederMasterDataFromNetwork base query. */
export async function countFeederMasterRows(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, FEEDER_MASTER_COUNT_SQL)) ?? 0;
}

/** Active substation networks — backend listSubstationMasterDataFromNetwork base query. */
export async function countSubstationMasterRows(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, SUBSTATION_MASTER_COUNT_SQL)) ?? 0;
}

export type DbConsumerRow = {
  meterLookupTblRefId: number;
  meterSerialNumber: string;
  ivrsNo: string | null;
};

export type DbMeterCommunicationRow = {
  meterSerialNumber: string;
};

/** Lookup by serial — communication list may include inactive meters. */
export async function getMeterCommunicationBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbMeterCommunicationRow | null> {
  const rows = await queryReadOnly<DbMeterCommunicationRow>(
    pool,
    `SELECT lml."Meter_Serial_Number" AS "meterSerialNumber"
     FROM public."L_Meter_Lookup" lml
     WHERE lml."Meter_Serial_Number" = $1
     LIMIT 1`,
    [serial],
  );
  return rows[0] ?? null;
}

/**
 * Consumer master spot check — backend listConsumerMasterDataFromView uses
 * V_Consumerdetails; IVRS maps to RRNumber (not M_Consumer_Connection.IVRS_Number).
 */
export async function getConsumerByMeterLookupId(
  pool: pg.Pool,
  meterLookupTblRefId: number,
): Promise<DbConsumerRow | null> {
  const rows = await queryReadOnly<DbConsumerRow>(
    pool,
    `SELECT v."MeterLookup_TblRefID" AS "meterLookupTblRefId",
            v."Meter_Serial_Number" AS "meterSerialNumber",
            v."RRNumber" AS "ivrsNo"
     FROM public."V_Consumerdetails" v
     INNER JOIN public."L_Meter_Lookup" lml
       ON lml."MeterLookup_TblRefID" = v."MeterLookup_TblRefID"
     WHERE v."MeterLookup_TblRefID" = $1
       AND lml."IsActiveStatus" = TRUE
     LIMIT 1`,
    [meterLookupTblRefId],
  );
  return rows[0] ?? null;
}
