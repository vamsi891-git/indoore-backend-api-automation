import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isDtrsDbSqlReady } from "../Db/dtrs.db";
import { runDtrsDbCoverage } from "./dtrs-db.harness";

apiDbTest.describe("DTRS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isDtrsDbSqlReady(),
      "Set DTRS_DB_SQL_READY=true after confirming Db/dtrs-sql.ts",
    );
  });

  apiDbTest(
    "IND-DTR-DB-001 — scaffold DB coverage",
    { tag: ["@dtrs", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runDtrsDbCoverage(authenticatedApi, db);
    },
  );
});
