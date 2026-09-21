import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../extras/db/postgres.client";
import { isDtrsDbSqlReady } from "../Db/dtrs.db";
import { runDtrsDbCoverage } from "./dtrs-db.harness";

apiDbTest.describe("DTR database checks", () => {
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isDtrsDbSqlReady(),
      "Set DTRS_DB_SQL_READY=true after confirming Db/dtrs-sql.ts",
    );
  });

  apiDbTest(
    "DTR profile in the API matches the database, and feeder count lines up",
    { tag: ["@dtrs", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runDtrsDbCoverage(authenticatedApi, db);
    },
  );
});
