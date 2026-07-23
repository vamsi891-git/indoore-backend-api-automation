import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isFeederDbSqlReady } from "../Db/feeder.db";
import { runFeederDbCoverage } from "./feeder-db.harness";

apiDbTest.describe("FEEDER — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isFeederDbSqlReady(),
      "Set FEEDER_DB_SQL_READY=true after confirming Db/feeder-sql.ts",
    );
  });

  apiDbTest(
    "IND-FD-DB-001 — Feeder profile + electrical meter spot-checks vs DB",
    { tag: ["@feeder", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runFeederDbCoverage(authenticatedApi, db);
    },
  );
});
