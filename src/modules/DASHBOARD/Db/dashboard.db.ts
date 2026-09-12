import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  DASHBOARD_ACTIVE_DTR_COUNT_SQL,
  DASHBOARD_ACTIVE_FEEDER_COUNT_SQL,
  DASHBOARD_ACTIVE_METER_COUNT_SQL,
  DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL,
  DASHBOARD_CATEGORY_COUNTS_SQL,
  DASHBOARD_CONNECTION_STATUS_COUNTS_SQL,
  DASHBOARD_CONSUMER_METER_STATUS_SQL,
  DASHBOARD_DTR_COMM_LAST_SEEN_COUNTS_SQL,
  DASHBOARD_DTR_CONSUMPTION_DAILY_PHASE_SQL,
  DASHBOARD_DTR_CONSUMPTION_DAILY_ROLLUP_SQL,
  DASHBOARD_DTR_CONSUMPTION_ROLLUP_EXISTS_SQL,
  DASHBOARD_DTR_FLEET_TOTAL_SQL,
  DASHBOARD_DTR_METER_COUNT_SQL,
  DASHBOARD_OEM_COUNTS_SQL,
  DASHBOARD_PHASE_COUNTS_SQL,
  DASHBOARD_T_DTR_DAILY_EXISTS_SQL,
} from "./dashboard-sql";

export type DtrCommLastSeenCounts = {
  totalActiveDtrMeters: number;
  communicatingMeters: number;
  nonCommunicatingMeters: number;
};

export type DashboardConnectionStatusSql = {
  cd: number;
  td: number;
  pd: number;
  totalMeterCount: number;
};

export type DashboardKeyedCount = { key: string; count: number };

export function isDashboardDbSqlReady(): boolean {
  return process.env.DASHBOARD_DB_SQL_READY?.trim().toLowerCase() === "true";
}

/** `getNetworkDetails` — `dtrMasterCatalogSql` COUNT(*). */
export async function countActiveDtrs(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, DASHBOARD_ACTIVE_DTR_COUNT_SQL)) ?? 0;
}

/** DTR summary `totalDtrs` — `dtrMasterCatalogCountSubquerySql`. */
export async function countDtrFleetTotal(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, DASHBOARD_DTR_FLEET_TOTAL_SQL)) ?? 0;
}

export async function countActiveFeeders(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DASHBOARD_ACTIVE_FEEDER_COUNT_SQL)) ?? 0
  );
}

export async function countActiveSubstations(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DASHBOARD_ACTIVE_SUBSTATION_COUNT_SQL)) ??
    0
  );
}

/** Distinct IVRS on the consumer-meter subquery (`totalMeterCount`). */
export async function countActiveMeters(pool: pg.Pool): Promise<number> {
  return (
    (await queryScalar<number>(pool, DASHBOARD_ACTIVE_METER_COUNT_SQL)) ?? 0
  );
}

export async function getConnectionStatusCounts(
  pool: pg.Pool,
): Promise<DashboardConnectionStatusSql> {
  const rows = await queryReadOnly<{
    cd: number;
    td: number;
    pd: number;
    total_meter_count: number;
  }>(pool, DASHBOARD_CONNECTION_STATUS_COUNTS_SQL);
  const row = rows[0];
  return {
    cd: Number(row?.cd ?? 0),
    td: Number(row?.td ?? 0),
    pd: Number(row?.pd ?? 0),
    totalMeterCount: Number(row?.total_meter_count ?? 0),
  };
}

export async function getCategoryWiseCounts(
  pool: pg.Pool,
): Promise<DashboardKeyedCount[]> {
  const rows = await queryReadOnly<{ key: string; count: number }>(
    pool,
    DASHBOARD_CATEGORY_COUNTS_SQL,
  );
  return rows.map((row) => ({
    key: String(row.key ?? ""),
    count: Number(row.count ?? 0),
  }));
}

export async function getPhaseWiseCounts(
  pool: pg.Pool,
): Promise<DashboardKeyedCount[]> {
  const rows = await queryReadOnly<{ key: string; count: number }>(
    pool,
    DASHBOARD_PHASE_COUNTS_SQL,
  );
  return rows.map((row) => ({
    key: String(row.key ?? ""),
    count: Number(row.count ?? 0),
  }));
}

export async function getOemWiseCounts(
  pool: pg.Pool,
): Promise<DashboardKeyedCount[]> {
  const rows = await queryReadOnly<{ key: string; count: number }>(
    pool,
    DASHBOARD_OEM_COUNTS_SQL,
  );
  return rows.map((row) => ({
    key: String(row.key ?? ""),
    count: Number(row.count ?? 0),
  }));
}

/** Active meters on an active DTR (no MeterType filter). */
export async function countDtrMetersOnActiveDtrs(
  pool: pg.Pool,
): Promise<number> {
  return (await queryScalar<number>(pool, DASHBOARD_DTR_METER_COUNT_SQL)) ?? 0;
}

/**
 * Unscoped communication last-seen snapshot
 * (`queryDtrCommunicationCountsFromLastSeen`).
 */
export async function getDtrCommLastSeenCounts(
  pool: pg.Pool,
): Promise<DtrCommLastSeenCounts> {
  const rows = await queryReadOnly<{
    total_active_dtr_meters: number;
    communicating_meters: number;
    non_communicating_meters: number;
  }>(pool, DASHBOARD_DTR_COMM_LAST_SEEN_COUNTS_SQL);
  const row = rows[0];
  return {
    totalActiveDtrMeters: Number(row?.total_active_dtr_meters ?? 0),
    communicatingMeters: Number(row?.communicating_meters ?? 0),
    nonCommunicatingMeters: Number(row?.non_communicating_meters ?? 0),
  };
}

export type DashboardEnergyPoint = {
  label: string;
  kwh: number;
  kvah: number;
  kvarh: number;
};

export type ConsumerMeterStatusSql = {
  totalConsumerMeters: number;
  communicatedConsumerMeters: number;
  nonCommunicatedConsumerMeters: number;
};

async function tableExists(
  pool: pg.Pool,
  sql: string,
  expected: string,
): Promise<boolean> {
  const rows = await queryReadOnly<{ table_name: string | null }>(pool, sql);
  return String(rows[0]?.table_name ?? "").includes(expected);
}

function mapEnergyPoints(
  rows: Array<{
    label?: string;
    bucket_label?: string;
    kwh: number;
    kvah: number;
    kvarh: number;
  }>,
): DashboardEnergyPoint[] {
  return rows.map((row) => ({
    label: String(row.bucket_label ?? row.label ?? ""),
    kwh: Number(row.kwh ?? 0),
    kvah: Number(row.kvah ?? 0),
    kvarh: Number(row.kvarh ?? 0),
  }));
}

function pointsHaveEnergy(points: DashboardEnergyPoint[]): boolean {
  return points.some(
    (p) => Number(p.kwh) > 0 || Number(p.kvah) > 0 || Number(p.kvarh) > 0,
  );
}

async function hasDtrConsumptionRollup(pool: pg.Pool): Promise<boolean> {
  const rows = await queryReadOnly<{
    daily_table: string | null;
    meta_table: string | null;
  }>(pool, DASHBOARD_DTR_CONSUMPTION_ROLLUP_EXISTS_SQL);
  const row = rows[0];
  return (
    row?.daily_table === "general.dtr_consumption_meter_daily" &&
    row?.meta_table === "general.dtr_consumption_rollup_meta"
  );
}

/**
 * Daily DTR consumption chart SQL: `T_DTR_DAILYData` when it has energy,
 * else rollup, else empty (API still returns 12 zero calendar points).
 */
export async function getDtrConsumptionDailySqlPoints(
  pool: pg.Pool,
): Promise<{ points: DashboardEnergyPoint[]; source: string }> {
  if (
    await tableExists(
      pool,
      DASHBOARD_T_DTR_DAILY_EXISTS_SQL,
      "T_DTR_DAILYData",
    )
  ) {
    const phase = mapEnergyPoints(
      await queryReadOnly<{
        bucket_label: string;
        kwh: number;
        kvah: number;
        kvarh: number;
      }>(pool, DASHBOARD_DTR_CONSUMPTION_DAILY_PHASE_SQL),
    );
    if (pointsHaveEnergy(phase)) {
      return { points: phase, source: "T_DTR_DAILYData" };
    }
  }
  if (await hasDtrConsumptionRollup(pool)) {
    const rollup = mapEnergyPoints(
      await queryReadOnly<{
        bucket_label: string;
        kwh: number;
        kvah: number;
        kvarh: number;
      }>(pool, DASHBOARD_DTR_CONSUMPTION_DAILY_ROLLUP_SQL),
    );
    return { points: rollup, source: "dtr_consumption_meter_daily" };
  }
  return { points: [], source: "empty-calendar" };
}

export async function getConsumerMeterStatusCounts(
  pool: pg.Pool,
): Promise<ConsumerMeterStatusSql> {
  const rows = await queryReadOnly<{
    total_consumer_meters: number;
    communicated_consumer_meters: number;
    non_communicated_consumer_meters: number;
  }>(pool, DASHBOARD_CONSUMER_METER_STATUS_SQL);
  const row = rows[0];
  return {
    totalConsumerMeters: Number(row?.total_consumer_meters ?? 0),
    communicatedConsumerMeters: Number(row?.communicated_consumer_meters ?? 0),
    nonCommunicatedConsumerMeters: Number(
      row?.non_communicated_consumer_meters ?? 0,
    ),
  };
}
