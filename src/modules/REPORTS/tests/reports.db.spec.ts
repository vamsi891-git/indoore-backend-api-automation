import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isReportsDbSqlReady } from "../Db/reports.db";
import { runReportsDbCoverage } from "./reports-db.harness";

apiDbTest.describe("REPORTS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isReportsDbSqlReady(),
      "Set REPORTS_DB_SQL_READY=true after confirming Db/reports-sql.ts",
    );
  });

  apiDbTest(
    "IND-REP-DB-001 — scaffold DB coverage",
    { tag: ["@reports", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runReportsDbCoverage(authenticatedApi, db);
    },
  );
});
