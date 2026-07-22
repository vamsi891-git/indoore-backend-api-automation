import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  CONNECTION_STATUS_COUNT_SQL,
  CONNECTION_STATUS_ROW_BY_ID_SQL,
  CONSUMER_CATEGORY_COUNT_SQL,
  CONSUMER_CATEGORY_ROW_BY_ID_SQL,
  DEVICE_MANUFACTURER_COUNT_SQL,
  DEVICE_MANUFACTURER_ROW_BY_ID_SQL,
  EVENT_CLASSIFICATION_COUNT_SQL,
  EVENT_CLASSIFICATION_ROW_BY_ID_SQL,
  EVENT_COUNT_SQL,
  EVENT_PRIORITY_COUNT_SQL,
  EVENT_PRIORITY_EXISTS_SQL,
  EVENT_ROW_BY_ID_SQL,
  METER_PHASE_COUNT_SQL,
  METER_PHASE_ROW_BY_ID_SQL,
  NETWORK_HIERARCHY_COUNT_SQL,
  NETWORK_HIERARCHY_ROW_BY_ID_SQL,
  ORG_HIERARCHY_COUNT_SQL,
  ORG_HIERARCHY_ROW_BY_ID_SQL,
  PAYMENT_CONTRACT_COUNT_SQL,
  PAYMENT_CONTRACT_ROW_BY_ID_SQL,
} from "./lookup-catalog-sql";

export function isUtilsLookupDbSqlReady(): boolean {
  return (
    process.env.UTILS_LOOKUP_DB_SQL_READY?.trim().toLowerCase() === "true"
  );
}

export function resolveUtilsLookupDbSampleSize(): number {
  const raw = Number(process.env.UTILS_LOOKUP_DB_SAMPLE_SIZE ?? "3");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
}

export function sampleIds<T>(ids: T[], size: number): T[] {
  if (ids.length <= size) return [...ids];
  return ids.slice(0, size);
}

async function count(pool: pg.Pool, sql: string): Promise<number> {
  return (await queryScalar<number>(pool, sql)) ?? 0;
}

export async function countConnectionStatuses(pool: pg.Pool): Promise<number> {
  return count(pool, CONNECTION_STATUS_COUNT_SQL);
}

export async function getConnectionStatusById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{
    id: number;
    name: string | null;
    shortName: string | null;
  }>(pool, CONNECTION_STATUS_ROW_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}

export async function countConsumerCategories(pool: pg.Pool): Promise<number> {
  return count(pool, CONSUMER_CATEGORY_COUNT_SQL);
}

export async function getConsumerCategoryById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{
    id: number;
    shortName: string;
    name: string;
  }>(pool, CONSUMER_CATEGORY_ROW_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}

export async function countPaymentContracts(pool: pg.Pool): Promise<number> {
  return count(pool, PAYMENT_CONTRACT_COUNT_SQL);
}

export async function getPaymentContractById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{
    id: number;
    name: string;
    code: string | null;
  }>(pool, PAYMENT_CONTRACT_ROW_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}

export async function countDeviceManufacturers(pool: pg.Pool): Promise<number> {
  return count(pool, DEVICE_MANUFACTURER_COUNT_SQL);
}

export async function getDeviceManufacturerById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{
    id: number;
    name: string;
    code: string | null;
  }>(pool, DEVICE_MANUFACTURER_ROW_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}

export async function countEvents(pool: pg.Pool): Promise<number> {
  return count(pool, EVENT_COUNT_SQL);
}

export async function getEventById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{
    id: number;
    code: number | null;
    name: string;
    description: string;
    eventReferenceTable: string | null;
  }>(pool, EVENT_ROW_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}

export async function countEventClassifications(pool: pg.Pool): Promise<number> {
  return count(pool, EVENT_CLASSIFICATION_COUNT_SQL);
}

export async function getEventClassificationById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{
    EventClassificationTblRefId: number;
    EventClassification_Name: string;
  }>(pool, EVENT_CLASSIFICATION_ROW_BY_ID_SQL, [id]);
  return rows[0] ?? null;
}

export async function countEventPriorities(pool: pg.Pool): Promise<number> {
  return count(pool, EVENT_PRIORITY_COUNT_SQL);
}

export async function eventPriorityExists(
  pool: pg.Pool,
  priorityTblRefId: number,
): Promise<boolean> {
  const present = await queryScalar<boolean>(pool, EVENT_PRIORITY_EXISTS_SQL, [
    priorityTblRefId,
  ]);
  return present === true;
}

export async function countMeterPhases(pool: pg.Pool): Promise<number> {
  return count(pool, METER_PHASE_COUNT_SQL);
}

export async function getMeterPhaseById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{ id: number; name: string }>(
    pool,
    METER_PHASE_ROW_BY_ID_SQL,
    [id],
  );
  return rows[0] ?? null;
}

export async function countOrganisationHierarchies(
  pool: pg.Pool,
): Promise<number> {
  return count(pool, ORG_HIERARCHY_COUNT_SQL);
}

export async function getOrganisationHierarchyById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{ id: number; code: string; name: string }>(
    pool,
    ORG_HIERARCHY_ROW_BY_ID_SQL,
    [id],
  );
  return rows[0] ?? null;
}

export async function countNetworkHierarchies(pool: pg.Pool): Promise<number> {
  return count(pool, NETWORK_HIERARCHY_COUNT_SQL);
}

export async function getNetworkHierarchyById(pool: pg.Pool, id: number) {
  const rows = await queryReadOnly<{ id: number; code: string; name: string }>(
    pool,
    NETWORK_HIERARCHY_ROW_BY_ID_SQL,
    [id],
  );
  return rows[0] ?? null;
}
