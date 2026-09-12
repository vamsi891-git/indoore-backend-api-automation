import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  COMMERCIAL_LF_LT5_REPORTING_COUNT_SQL,
  COMMERCIAL_METER_BY_LOOKUP_ID_SQL,
  COMMERCIAL_METER_BY_MSN_AND_DTR_SQL,
  COMMERCIAL_METER_BY_MSN_SQL,
  COMMERCIAL_PF_BY_MSN_SQL,
  COMMERCIAL_PF_VIOLATION_COUNT_SQL,
  COMMERCIAL_REPORTING_LF_TABLES_EXIST_SQL,
  buildCommercialLfViolationCountSql,
} from "./commericial-analysis-sql";

export function isCommericialAnalysisDbSqlReady(): boolean {
  return (
    process.env.COMMERICIAL_ANALYSIS_DB_SQL_READY?.trim().toLowerCase() ===
    "true"
  );
}

export type DbCommercialMeterRow = {
  meterLookupId: number;
  msn: string;
  circle: string;
  division: string;
  subDivision: string;
  feeder: string;
  dtr: string;
  name: string;
  ivrsNumber: string;
  tariff: string;
  phase: string;
  sanctionLoadKw: number;
  connectedLoadKw: number;
};

export type DbCommercialPfRow = {
  msn: string;
  pf_value: number;
};

export function commercialMonthDateRange(
  month: number,
  year: number,
): { startDate: Date; endDate: Date } {
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 1)),
  };
}

export async function getCommercialMeterByLookupId(
  pool: pg.Pool,
  meterLookupId: number,
): Promise<DbCommercialMeterRow | null> {
  if (!Number.isFinite(meterLookupId) || meterLookupId <= 0) return null;
  const rows = await queryReadOnly<DbCommercialMeterRow>(
    pool,
    COMMERCIAL_METER_BY_LOOKUP_ID_SQL,
    [meterLookupId],
  );
  return rows[0] ?? null;
}

export async function getCommercialMeterByMsnAndDtr(
  pool: pg.Pool,
  msn: string,
  dtr: string,
): Promise<DbCommercialMeterRow | null> {
  if (!msn.trim() || !dtr.trim()) return null;
  const rows = await queryReadOnly<DbCommercialMeterRow>(
    pool,
    COMMERCIAL_METER_BY_MSN_AND_DTR_SQL,
    [msn, dtr],
  );
  return rows[0] ?? null;
}

export async function getCommercialMeterByMsn(
  pool: pg.Pool,
  msn: string,
): Promise<DbCommercialMeterRow | null> {
  const rows = await queryReadOnly<DbCommercialMeterRow>(
    pool,
    COMMERCIAL_METER_BY_MSN_SQL,
    [msn],
  );
  return rows[0] ?? null;
}

export async function countCommercialPfViolations(
  archivePool: pg.Pool,
  month: number,
  year: number,
  threshold: number,
): Promise<number> {
  const { startDate, endDate } = commercialMonthDateRange(month, year);
  return (
    (await queryScalar<number>(
      archivePool,
      COMMERCIAL_PF_VIOLATION_COUNT_SQL,
      [startDate, endDate, threshold],
    )) ?? 0
  );
}

export async function getCommercialPfByMsn(
  archivePool: pg.Pool,
  month: number,
  year: number,
  threshold: number,
  msn: string,
): Promise<DbCommercialPfRow | null> {
  const { startDate, endDate } = commercialMonthDateRange(month, year);
  const rows = await queryReadOnly<DbCommercialPfRow>(
    archivePool,
    COMMERCIAL_PF_BY_MSN_SQL,
    [startDate, endDate, threshold, msn],
  );
  return rows[0] ?? null;
}

/** Multi-month window matching CommercialAnalysisRepository.getMultiMonthDateRange */
export function commercialMultiMonthDateRange(
  month: number,
  year: number,
  monthsBack: number,
): { startDate: Date; endDate: Date } {
  return {
    startDate: new Date(Date.UTC(year, month - monthsBack, 1)),
    endDate: new Date(Date.UTC(year, month, 1)),
  };
}

/**
 * Unscoped archive LF violation count (API total ≤ this when JWT scope filters meters).
 */
export async function countCommercialLfViolations(
  archivePool: pg.Pool,
  options: {
    month: number;
    year: number;
    months: number;
    operator: "lt" | "gt";
    threshold: 5 | 100;
  },
): Promise<number> {
  const { month, year, months, operator, threshold } = options;
  const { startDate, endDate } =
    months === 1
      ? commercialMonthDateRange(month, year)
      : commercialMultiMonthDateRange(month, year, months);
  const sql = buildCommercialLfViolationCountSql(operator, threshold);
  return (
    (await queryScalar<number>(archivePool, sql, [startDate, endDate])) ?? 0
  );
}

function isoMonthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export async function hasCommercialReportingLfTables(
  archivePool: pg.Pool,
): Promise<boolean> {
  const rows = await queryReadOnly<{
    day_fact: string | null;
    meter_dim: string | null;
  }>(archivePool, COMMERCIAL_REPORTING_LF_TABLES_EXIST_SQL);
  const row = rows[0];
  return Boolean(row?.day_fact && row?.meter_dim);
}

/** `commercialLfLt5SummarySql` unscoped COUNT. */
export async function countCommercialLfLt5Reporting(
  archivePool: pg.Pool,
  month: number,
  year: number,
): Promise<number | null> {
  if (!(await hasCommercialReportingLfTables(archivePool))) return null;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return (
    (await queryScalar<number>(archivePool, COMMERCIAL_LF_LT5_REPORTING_COUNT_SQL, [
      isoMonthStart(year, month),
      isoMonthStart(prevYear, prevMonth),
    ])) ?? 0
  );
}
