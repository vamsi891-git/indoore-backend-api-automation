import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  BILLING_ARCHIVE_UNIVERSE_DISTINCT_COUNT_SQL,
  BILLING_CLASS_D1_DISTINCT_COUNT_SQL,
  BILLING_CLASS_D2_DISTINCT_COUNT_SQL,
  BILLING_CLASS_D3_DISTINCT_COUNT_SQL,
  BILLING_DT_METER_SERIALS_SQL,
  BILLING_METER_HEADER_BY_SERIAL_SQL,
} from "./billing-sql";

export type DbBillingMeterHeader = {
  meterLookupId: number;
  meterNumber: string;
  ivrsNumber: string | null;
  consumerName: string | null;
  consumerAddress: string | null;
  phase: string | null;
  mf: number | null;
  sanctionedLoadKw: number | null;
};

export type BillingArchiveClass = "d1" | "d2" | "d3";

const DEFAULT_DTR_METER_TYPE_TBL_REF_ID = 2;

/** Backend listMeterHeadersForSerialsInScope — header row for one meter serial. */
export async function getBillingMeterHeaderBySerial(
  pool: pg.Pool,
  meterSerial: string,
): Promise<DbBillingMeterHeader | null> {
  const rows = await queryReadOnly<DbBillingMeterHeader>(
    pool,
    BILLING_METER_HEADER_BY_SERIAL_SQL,
    [meterSerial],
  );
  return rows[0] ?? null;
}

function distinctCountSqlForClass(billingClass: BillingArchiveClass): string {
  switch (billingClass) {
    case "d2":
      return BILLING_CLASS_D2_DISTINCT_COUNT_SQL;
    case "d3":
      return BILLING_CLASS_D3_DISTINCT_COUNT_SQL;
    case "d1":
    default:
      return BILLING_CLASS_D1_DISTINCT_COUNT_SQL;
  }
}

/**
 * Backend `countBillingClassMonthDistinct` — single archive class
 * (1st-of-month midnight, DISTINCT serial+day).
 */
export async function countBillingClassMonthDistinct(
  archivePool: pg.Pool,
  year: number,
  month: number,
  billingClass: BillingArchiveClass = "d1",
): Promise<number> {
  const monthStart = billingMonthStart(year, month);
  const raw = await queryScalar<string | number | bigint>(
    archivePool,
    distinctCountSqlForClass(billingClass),
    [monthStart],
  );
  return Number(raw ?? 0);
}

/** Backend listDtMeterSerialsLower — active DT meter serials on main DB. */
export async function listDtMeterSerialsLower(mainPool: pg.Pool): Promise<string[]> {
  const typeId = Number(
    process.env.DTR_METER_TYPE_TBL_REF_ID ?? DEFAULT_DTR_METER_TYPE_TBL_REF_ID,
  );
  if (!Number.isFinite(typeId) || typeId <= 0) {
    return [];
  }
  const rows = await queryReadOnly<{ sn: string }>(
    mainPool,
    BILLING_DT_METER_SERIALS_SQL,
    [typeId],
  );
  return rows.map((r) => String(r.sn ?? "").trim()).filter((s) => s.length > 0);
}

/**
 * Unscoped billing-data pagination universe matching live API total:
 * DISTINCT serial across D1∪D2∪D3 (1st-of-month midnight) minus DT meters.
 */
export async function countBillingArchiveUniverseDistinct(
  archivePool: pg.Pool,
  mainPool: pg.Pool,
  year: number,
  month: number,
): Promise<number> {
  const monthStart = billingMonthStart(year, month);
  const excludedSerials = await listDtMeterSerialsLower(mainPool);
  const raw = await queryScalar<string | number | bigint>(
    archivePool,
    BILLING_ARCHIVE_UNIVERSE_DISTINCT_COUNT_SQL,
    [monthStart, excludedSerials],
  );
  return Number(raw ?? 0);
}

/** @deprecated Prefer countBillingArchiveUniverseDistinct / countBillingClassMonthDistinct. */
export async function countBillingClassD3RowsInMonth(
  archivePool: pg.Pool,
  year: number,
  month: number,
): Promise<number> {
  return countBillingClassMonthDistinct(archivePool, year, month, "d3");
}

export function billingMonthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function resolveBillingArchiveClass(
  value: string | null | undefined,
): BillingArchiveClass {
  const normalized = String(value ?? "d1")
    .trim()
    .toLowerCase();
  if (normalized === "d2" || normalized === "d3") {
    return normalized;
  }
  return "d1";
}
