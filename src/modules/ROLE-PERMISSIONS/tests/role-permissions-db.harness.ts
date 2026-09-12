import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";

/**
 * Scaffold only — must not report green when the DB gate is on.
 * Leave `ROLE_PERMISSIONS_DB_SQL_READY` unset until real SQL is pasted.
 */
export async function runRolePermissionsDbCoverage(
  _authenticatedApi: APIRequestContext,
  _db: pg.Pool,
): Promise<void> {
  void _authenticatedApi;
  void _db;
  throw new Error(
    "ROLE-PERMISSIONS DB SQL not implemented (SQL_TODO). " +
      "Unset ROLE_PERMISSIONS_DB_SQL_READY until repository SQL is pasted — " +
      "scaffold harnesses must not pass.",
  );
}
