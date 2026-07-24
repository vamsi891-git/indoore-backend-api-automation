import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isConsumptionDbSqlReady } from "../Db/consumption.db";
import { runConsumptionDbCoverage } from "./consumption-db.harness";

apiDbTest.describe("CONSUMPTION — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isConsumptionDbSqlReady(),
      "Set CONSUMPTION_DB_SQL_READY=true after confirming Db/consumption-sql.ts",
    );
  });

  apiDbTest(
    "IND-CON-DB-001 — scaffold DB coverage",
    { tag: ["@consumption", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runConsumptionDbCoverage(authenticatedApi, db);
    },
  );
});
