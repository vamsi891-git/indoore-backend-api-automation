import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";

/**
 * Scaffold only — must not report green when the DB gate is on.
 * Leave `USERS_PROFILE_IMAGE_DB_SQL_READY` unset until real SQL is pasted.
 */
export async function runUsersProfileImageDbCoverage(
  _authenticatedApi: APIRequestContext,
  _db: pg.Pool,
): Promise<void> {
  void _authenticatedApi;
  void _db;
  throw new Error(
    "USERS-PROFILE-IMAGE DB SQL not implemented (SQL_TODO). " +
      "Unset USERS_PROFILE_IMAGE_DB_SQL_READY until repository SQL is pasted — " +
      "scaffold harnesses must not pass.",
  );
}
