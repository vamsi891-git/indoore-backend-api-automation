import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../extras/db/postgres.client";
import {
  MODULES_PERMISSIONS_MODULE_BY_ID_SQL,
  MODULES_PERMISSIONS_MODULE_COUNT_SQL,
  MODULES_PERMISSIONS_PERMISSION_COUNT_SQL,
} from "./modules-permissions-sql";

export function isModulesPermissionsDbSqlReady(): boolean {
  return process.env.MODULES_PERMISSIONS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbModulesPermissionsModuleRow = {
  id: number;
  key: string;
  name: string;
  isEnabled: boolean;
  permissionCount: number;
};

export async function countModulesCatalog(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, MODULES_PERMISSIONS_MODULE_COUNT_SQL)) ?? 0;
}

export async function countPermissionsCatalog(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, MODULES_PERMISSIONS_PERMISSION_COUNT_SQL)) ?? 0;
}

export async function getModuleById(
  pool: pg.Pool,
  moduleId: number,
): Promise<DbModulesPermissionsModuleRow | null> {
  const rows = await queryReadOnly<DbModulesPermissionsModuleRow>(
    pool,
    MODULES_PERMISSIONS_MODULE_BY_ID_SQL,
    [moduleId],
  );
  return rows[0] ?? null;
}
