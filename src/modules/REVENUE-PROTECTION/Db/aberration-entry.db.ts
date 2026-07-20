import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  ABERRATION_ENTRY_COUNT_SQL,
  ABERRATION_ENTRY_EXISTS_BY_IVRS_SQL,
  ABERRATION_ENTRY_LATEST_BY_IVRS_SQL,
  ABERRATION_ENTRY_ROW_BY_BUSINESS_KEY_SQL,
} from "./aberration-entry-sql";
import type { AberrationEntryQuery, AberrationEntryType } from "../Mapper/aberration-entry.mapper";
import {
  resolveDbSampleSize,
  sampleRowIds,
} from "./cases.db";

export type DbAberrationEntryRow = {
  ivrs: string | null;
  eventName: string | null;
  amountBilled: number;
  amountRealised: number;
  remarks: string | null;
  fieldOfficerRemarks: string | null;
  fieldOfficerName: string | null;
  fieldOfficerDesignation: string | null;
  mrTransactionNo: string | null;
  p4No: string | null;
};

export function isAberrationEntryDbSqlReady(): boolean {
  return (
    process.env.RP_ABERRATION_ENTRY_DB_SQL_READY
      ?.trim()
      .toLowerCase() === "true"
  );
}

const CASE_LEVEL_BY_ENTRY_TYPE: Record<AberrationEntryType, string> = {
  zone: "ZONE_OFFICE",
  eenltmt: "EENLMT",
};

function resolveCaseLevel(query: AberrationEntryQuery): string {
  const entryType = query.entryType ?? "zone";
  return CASE_LEVEL_BY_ENTRY_TYPE[entryType];
}

export async function countAberrationEntryForFilters(
  pool: pg.Pool,
  query: AberrationEntryQuery,
): Promise<number> {
  return (
    (
      await queryScalar<number>(
        pool,
        ABERRATION_ENTRY_COUNT_SQL,
        [
          query.month ?? null,
          query.year ? String(query.year) : null,
          resolveCaseLevel(query),
        ],
      )
    ) ?? 0
  );
}

export async function getAberrationEntryRowByBusinessKey(
  pool: pg.Pool,
  ivrs: string,
  eventName: string,
  amountBilled: number,
  caseLevel?: string | null,
): Promise<DbAberrationEntryRow | null> {
  const rows = await queryReadOnly<DbAberrationEntryRow>(
    pool,
    ABERRATION_ENTRY_ROW_BY_BUSINESS_KEY_SQL,
    [
      ivrs,
      eventName,
      amountBilled,
      caseLevel ?? null,
    ],
  );

  return rows[0] ?? null;
}

export async function countAberrationEntryByIvrs(
  pool: pg.Pool,
  ivrsNo: string,
): Promise<number> {
  return (
    (
      await queryScalar<number>(pool, ABERRATION_ENTRY_EXISTS_BY_IVRS_SQL, [
        ivrsNo,
      ])
    ) ?? 0
  );
}

export async function getLatestAberrationEntryByIvrs(
  pool: pg.Pool,
  ivrsNo: string,
): Promise<DbAberrationEntryRow | null> {
  const rows = await queryReadOnly<DbAberrationEntryRow>(
    pool,
    ABERRATION_ENTRY_LATEST_BY_IVRS_SQL,
    [ivrsNo],
  );
  return rows[0] ?? null;
}

/**
 * Reuse common DB sampling helpers.
 */
export {
  resolveDbSampleSize,
  sampleRowIds,
};