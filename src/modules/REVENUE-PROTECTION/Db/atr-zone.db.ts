import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import { ATRZONE_COUNT_SQL, ATRZONE_ROW_BY_BUSINESS_KEY_SQL } from "./atr-zone-sql";
import type { AtrZoneQuery } from "../Mapper/atr-zone.mapper";
import { resolveDbSampleSize, sampleRowIds } from "./cases.db"; // reuse existing helpers

export type DbAtrZoneRow = {
  ivrs: string | null;
  eventName: string | null;
  amountBilled: number;
  amountRealised: number;
  p4Number: string | null;
};

export function isAtrZoneDbSqlReady(): boolean {
  return process.env.RP_ATRZONE_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export async function countAtrZoneForFilters(
  pool: pg.Pool,
  query: AtrZoneQuery,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, ATRZONE_COUNT_SQL, [String(query.year)])) ?? 0
  );
}

export async function getAtrZoneRowByBusinessKey(
  pool: pg.Pool,
  ivrs: string,
  eventName: string,
  amountBilled: number,
): Promise<DbAtrZoneRow | null> {
  const rows = await queryReadOnly<DbAtrZoneRow>(
    pool,
    ATRZONE_ROW_BY_BUSINESS_KEY_SQL,
    [ivrs, eventName, amountBilled],
  );
  return rows[0] ?? null;
}

export { resolveDbSampleSize, sampleRowIds };