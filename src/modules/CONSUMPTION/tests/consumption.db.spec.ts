import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../extras/db/postgres.client";
import { isConsumptionDbSqlReady } from "../Db/consumption.db";
import { runConsumptionDbCoverage } from "./consumption-db.harness";

apiDbTest.describe("CONSUMPTION — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isConsumptionDbSqlReady(),
      "Skipped until live SQL is confirmed — set CONSUMPTION_DB_SQL_READY=true after verifying Db/consumption-sql.ts against the real schema",
    );
  });

  apiDbTest(
    "IND-CON-DB-001 — daily + net-meter + pattern totalCount vs DB",
    { tag: ["@consumption", "@db"] },
    async ({ authenticatedApi, db, archiveDb }) => {
      await runConsumptionDbCoverage(authenticatedApi, db, archiveDb);
    },
  );
});
