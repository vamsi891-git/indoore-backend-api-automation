import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  MR_CONSUMER_BY_ID_SQL,
  MR_DASHBOARD_OVERALL_SQL,
  MR_METER_BY_SERIAL_SQL,
  MR_MY_WORK_BY_SUBMITTER_SQL,
  MR_PROGRESS_WEEKLY_SUM_SQL,
  MR_SUBMISSION_BY_ID_SQL,
  MR_SUBMISSION_HISTORY_COUNT_SQL,
} from "./meter-replacement-sql";

export function isMeterReplacementDbSqlReady(): boolean {
  return (
    process.env.METER_REPLACEMENT_DB_SQL_READY?.trim().toLowerCase() === "true"
  );
}

export type DbMrConsumerRow = {
  consumerId: number;
  consumerCid: string;
  consumerName: string;
  rrNumber: string;
  accountId: string;
  servicePointId: string;
  oldMeterLookupId: number | null;
  oldMeterSerial: string;
  meterActive: boolean;
  consumerActive: boolean;
  zone: string;
  office: string;
};

export type DbMrMeterRow = {
  meterSerialNumber: string;
  meterLookupTblRefId: number;
  isActive: boolean;
  isAssigned: boolean;
};

export type DbMrDashboardOverall = {
  totalMetersRequested: number;
  totalMetersReplaced: number;
  totalPendingMeters: number;
  totalUnmappedMeters: number;
};

export type DbMrSubmissionRow = {
  id: number;
  status: string;
  consumerId: number;
  oldMeterSerial: string;
  newMeterSerial: string;
  oldMeterLookupId: number | null;
  newMeterLookupId: number | null;
};

export type DbMrMyWorkRow = {
  completedToday: number;
  completedThisMonth: number;
  totalCompleted: number;
};

export async function getMrConsumerById(
  pool: pg.Pool,
  consumerId: number,
): Promise<DbMrConsumerRow | null> {
  const rows = await queryReadOnly<DbMrConsumerRow>(
    pool,
    MR_CONSUMER_BY_ID_SQL,
    [consumerId],
  );
  return rows[0] ?? null;
}

export async function getMrMeterBySerial(
  pool: pg.Pool,
  serial: string,
): Promise<DbMrMeterRow | null> {
  const rows = await queryReadOnly<DbMrMeterRow>(pool, MR_METER_BY_SERIAL_SQL, [
    serial,
  ]);
  return rows[0] ?? null;
}

export async function getMrDashboardOverall(
  pool: pg.Pool,
): Promise<DbMrDashboardOverall> {
  const rows = await queryReadOnly<DbMrDashboardOverall>(
    pool,
    MR_DASHBOARD_OVERALL_SQL,
  );
  return (
    rows[0] ?? {
      totalMetersRequested: 0,
      totalMetersReplaced: 0,
      totalPendingMeters: 0,
      totalUnmappedMeters: 0,
    }
  );
}

export async function countMrSubmissions(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, MR_SUBMISSION_HISTORY_COUNT_SQL)) ?? 0
  );
}

export async function getMrSubmissionById(
  pool: pg.Pool,
  submissionId: number,
): Promise<DbMrSubmissionRow | null> {
  const rows = await queryReadOnly<DbMrSubmissionRow>(
    pool,
    MR_SUBMISSION_BY_ID_SQL,
    [submissionId],
  );
  return rows[0] ?? null;
}

export async function getMrMyWorkBySubmitter(
  pool: pg.Pool,
  submittedByUuid: string,
): Promise<DbMrMyWorkRow | null> {
  const rows = await queryReadOnly<DbMrMyWorkRow>(
    pool,
    MR_MY_WORK_BY_SUBMITTER_SQL,
    [submittedByUuid],
  );
  return rows[0] ?? null;
}

export async function sumMrProgressWeekly(
  pool: pg.Pool,
  submittedByUuid: string,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, MR_PROGRESS_WEEKLY_SUM_SQL, [
      submittedByUuid,
    ])) ?? 0
  );
}
