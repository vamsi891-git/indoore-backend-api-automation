import pg from "pg";
import { test as apiTest } from "./api.fixture";
import { createPgPool, isDbConfigured } from "../core/db/postgres.client";

type ApiDbFixtures = {
  db: pg.Pool;
};

/** Authenticated API + optional read-only PostgreSQL (skips when DB_* unset). */
export const test = apiTest.extend<ApiDbFixtures>({
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
