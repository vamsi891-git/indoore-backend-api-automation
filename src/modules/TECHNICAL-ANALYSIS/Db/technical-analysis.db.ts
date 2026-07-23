import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  TECHNICAL_CONSUMER_BY_IVRS_OR_MSN_SQL,
  TECHNICAL_CONSUMER_METER_UNIVERSE_SQL,
} from "./technical-analysis-sql";

export function isTechnicalAnalysisDbSqlReady(): boolean {
  return (
    process.env.TECHNICAL_ANALYSIS_DB_SQL_READY?.trim().toLowerCase() === "true"
  );
}

export function resolveTechnicalAnalysisDbSampleSize(): number {
  const raw = Number(process.env.TECHNICAL_ANALYSIS_DB_SAMPLE_SIZE ?? "3");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
}

export type DbTechnicalConsumerRow = {
  consumerName: string;
  accountId: string;
  rrNumber: string;
  meterSerialNumber: string;
  meterLookupTblRefId: number;
};

export async function getTechnicalConsumerByIvrsOrMsn(
  pool: pg.Pool,
  ivrsOrMsn: string,
): Promise<DbTechnicalConsumerRow | null> {
  const rows = await queryReadOnly<DbTechnicalConsumerRow>(
    pool,
    TECHNICAL_CONSUMER_BY_IVRS_OR_MSN_SQL,
    [ivrsOrMsn],
  );
  return rows[0] ?? null;
}

export async function countTechnicalConsumerMeters(
  pool: pg.Pool,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, TECHNICAL_CONSUMER_METER_UNIVERSE_SQL)) ??
    0
  );
}
