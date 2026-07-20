import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  CASES_COUNT_SQL,
  CASES_ROW_BY_BUSINESS_KEY_SQL,
  ORG_HIERARCHY_EXISTS_SQL,
} from "./cases-sql";
import type { CasesQuery } from "../Mapper/cases.mapper";

export type DbCaseRow = {
  id: string;
  ivrsNo: string | null;
  event: string | null;
  amountBilled: number;
  amountRealisation: number;
  p4Number: string | null;
  status: string | null;
};

export type OrgHierarchyExists = {
  circle_ok: boolean;
  division_ok: boolean;
  zone_ok: boolean;
};

export function isCasesDbSqlReady(): boolean {
  return process.env.RP_CASES_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export function resolveDbSampleSize(): number {
  const raw = Number(process.env.RP_DB_SAMPLE_SIZE ?? "3");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
}

export async function countCasesForFilters(
  pool: pg.Pool,
  query: CasesQuery,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, CASES_COUNT_SQL, [
      String(query.month),
      String(query.year),
    ])) ?? 0
  );
}

export async function getCaseRowByBusinessKey(
  pool: pg.Pool,
  ivrsNo: string,
  event: string,
  amountBilled: number,
): Promise<DbCaseRow | null> {
  const rows = await queryReadOnly<DbCaseRow>(
    pool,
    CASES_ROW_BY_BUSINESS_KEY_SQL,
    [ivrsNo, event, amountBilled],
  );
  return rows[0] ?? null;
}

export async function orgHierarchyExists(
  pool: pg.Pool,
  circle: string,
  division: string,
  zone: string,
): Promise<OrgHierarchyExists> {
  const rows = await queryReadOnly<OrgHierarchyExists>(
    pool,
    ORG_HIERARCHY_EXISTS_SQL,
    [circle, division, zone],
  );
  return (
    rows[0] ?? {
      circle_ok: false,
      division_ok: false,
      zone_ok: false,
    }
  );
}

/** Pick up to N distinct row ids uniformly from the page. */
export function sampleRowIds(ids: string[], sampleSize: number): string[] {
  if (ids.length <= sampleSize) {
    return [...ids];
  }
  const step = ids.length / sampleSize;
  const picked: string[] = [];
  for (let i = 0; i < sampleSize; i += 1) {
    const index = Math.min(ids.length - 1, Math.floor(i * step));
    picked.push(ids[index]!);
  }
  return [...new Set(picked)];
}
