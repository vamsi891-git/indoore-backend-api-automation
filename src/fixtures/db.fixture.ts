import pg from "pg";
import { test as base } from "./base.fixture";
import { createPgPool, isDbConfigured } from "../core/db/postgres.client";

type DbFixtures = {
  db: pg.Pool;
};

/**
 * Optional read-only PostgreSQL pool for API-vs-DB validation.
 * Skips the test when DB_* env vars are not set.
 */
export const test = base.extend<DbFixtures>({
  db: async ({}, use, testInfo) => {
    if (!isDbConfigured()) {
      testInfo.skip(true, "DB_* not configured in .env — API-only run");
      return;
    }

    const pool = createPgPool();
    try {
      await use(pool);
    } finally {
      await pool.end();
    }
  },
});
