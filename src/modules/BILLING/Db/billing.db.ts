import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  BILLING_CLASS_D3_COUNT_SQL,
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

/** countBillingClassD3RowsInMonth — run against archive DB pool. */
export async function countBillingClassD3RowsInMonth(
  archivePool: pg.Pool,
  year: number,
  month: number,
): Promise<number> {
  const mm = String(month).padStart(2, "0");
  const monthStart = `${year}-${mm}-01`;
  return (
    (await queryScalar<number>(
      archivePool,
      BILLING_CLASS_D3_COUNT_SQL,
      [monthStart],
    )) ?? 0
  );
}

export function billingMonthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
