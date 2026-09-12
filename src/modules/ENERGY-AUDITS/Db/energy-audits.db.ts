import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  ENERGY_AUDIT_DTR_BY_NAME_UNDER_ROOT_SQL,
  ENERGY_AUDIT_DTR_COUNT_UNDER_ROOT_SQL,
} from "./energy-audits-sql";

export function isEnergyAuditsDbSqlReady(): boolean {
  return process.env.ENERGY_AUDITS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

const DEFAULT_DTR_METER_TYPE_TBL_REF_ID = 2;

export function resolveDtrMeterTypeTblRefId(): number {
  const fromEnv = Number(process.env.DTR_METER_TYPE_TBL_REF_ID ?? "");
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : DEFAULT_DTR_METER_TYPE_TBL_REF_ID;
}

export type DbEnergyAuditDtrRow = {
  dtr_id: number;
  dtr_name: string;
  dtr_code: string;
  meter_serial: string | null;
  consumer_count: number;
};

export async function countEnergyAuditDtrsUnderRoot(
  pool: pg.Pool,
  networkLookupId: number,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, ENERGY_AUDIT_DTR_COUNT_UNDER_ROOT_SQL, [
      networkLookupId,
    ])) ?? 0
  );
}

export async function getEnergyAuditDtrByNameUnderRoot(
  pool: pg.Pool,
  networkLookupId: number,
  dtrName: string,
  dtrMeterTypeId: number = resolveDtrMeterTypeTblRefId(),
): Promise<DbEnergyAuditDtrRow | null> {
  const rows = await queryReadOnly<DbEnergyAuditDtrRow>(
    pool,
    ENERGY_AUDIT_DTR_BY_NAME_UNDER_ROOT_SQL,
    [networkLookupId, dtrName, dtrMeterTypeId],
  );
  return rows[0] ?? null;
}
