import pg from "pg";
import { test as apiTest } from "./api.fixture";
import {
  createArchivePgPool,
  createPgPool,
  isArchiveDbConfigured,
  isDbConfigured,
} from "../core/db/postgres.client";

type ApiDbFixtures = {
  db: pg.Pool;
  archiveDb: pg.Pool;
};

/** Authenticated API + optional read-only PostgreSQL (skips when DB_* unset / unreachable). */
export const test = apiTest.extend<ApiDbFixtures>({
  db: async ({}, use, testInfo) => {
    if (!isDbConfigured()) {
      testInfo.skip(true, "DB_* not configured in .env — API-only run");
      return;
    }

    const pool = createPgPool();
    try {
      // CI runners often cannot reach private/VPN DB hosts — soft-skip instead of hard fail.
      await pool.query("SELECT 1");
    } catch (error) {
      await pool.end().catch(() => undefined);
      const detail = error instanceof Error ? error.message : String(error);
      testInfo.skip(
        true,
        `DB configured but unreachable from this runner (${detail}). Open firewall to CI or run @db locally.`,
      );
      return;
    }

    try {
      await use(pool);
    } finally {
      await pool.end();
    }
  },

  archiveDb: async ({}, use) => {
    if (!isArchiveDbConfigured()) {
      await use(null as unknown as pg.Pool);
      return;
    }

    const pool = createArchivePgPool();
    try {
      await use(pool);
    } finally {
      await pool.end();
    }
  },
});
