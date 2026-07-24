import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isAuditLogsDbSqlReady } from "../Db/audit-logs.db";
import { runAuditLogsDbCoverage } from "./audit-logs-db.harness";

apiDbTest.describe("AUDIT-LOGS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isAuditLogsDbSqlReady(),
      "Set AUDIT_LOGS_DB_SQL_READY=true after confirming Db/audit-logs-sql.ts",
    );
  });

  apiDbTest(
    "IND-AUD-DB-001 — scaffold DB coverage",
    { tag: ["@audit-logs", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runAuditLogsDbCoverage(authenticatedApi, db);
    },
  );
});
