import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  AUTH_ACTIVE_DEVICE_BY_ID_SQL,
  AUTH_ACTIVE_DEVICES_COUNT_SQL,
  AUTH_ACTIVE_SESSION_FAMILY_COUNT_SQL,
  AUTH_INVITATION_SUMMARY_SQL,
  AUTH_USER_BY_ID_SQL,
} from "./auth-sql";

export function isAuthDbSqlReady(): boolean {
  return process.env.AUTH_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbAuthUserRow = {
  id: string;
  email: string;
  status: string;
  role_name: string;
  role_sort_order: number;
  first_name: string | null;
  last_name: string | null;
  organisation_lookup_id: number | null;
  network_lookup_id: number | null;
  consumer_id: string | null;
  consumer_tbl_ref_id: number | null;
  failed_login_attempts: number | null;
};

export type DbAuthDeviceRow = {
  id: string;
  user_id: string;
  name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  last_ip_address: string | null;
  last_location_text: string | null;
  revoked_at: Date | string | null;
};

export type DbAuthInvitationSummary = {
  total: number;
  accepted_count: number;
  pending_count: number;
  expired_count: number;
};

export async function getAuthUserById(
  pool: pg.Pool,
  userId: string,
): Promise<DbAuthUserRow | null> {
  const rows = await queryReadOnly<DbAuthUserRow>(pool, AUTH_USER_BY_ID_SQL, [
    userId,
  ]);
  return rows[0] ?? null;
}

export async function countAuthActiveDevices(
  pool: pg.Pool,
  userId: string,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, AUTH_ACTIVE_DEVICES_COUNT_SQL, [
      userId,
    ])) ?? 0
  );
}

export async function getAuthActiveDeviceById(
  pool: pg.Pool,
  deviceId: string,
  userId: string,
): Promise<DbAuthDeviceRow | null> {
  const rows = await queryReadOnly<DbAuthDeviceRow>(
    pool,
    AUTH_ACTIVE_DEVICE_BY_ID_SQL,
    [deviceId, userId],
  );
  return rows[0] ?? null;
}

export async function getAuthInvitationSummary(
  pool: pg.Pool,
  invitedByUserId: string,
): Promise<DbAuthInvitationSummary> {
  const rows = await queryReadOnly<DbAuthInvitationSummary>(
    pool,
    AUTH_INVITATION_SUMMARY_SQL,
    [invitedByUserId],
  );
  return (
    rows[0] ?? {
      total: 0,
      accepted_count: 0,
      pending_count: 0,
      expired_count: 0,
    }
  );
}

export async function countAuthActiveSessionFamilies(
  pool: pg.Pool,
  userId: string,
): Promise<number> {
  return (
    (await queryScalar<number>(pool, AUTH_ACTIVE_SESSION_FAMILY_COUNT_SQL, [
      userId,
    ])) ?? 0
  );
}
