import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isUsersAdminDbSqlReady } from "../Db/users-admin.db";
import { runUsersAdminDbCoverage } from "./users-admin-db.harness";

apiDbTest.describe("USERS-ADMIN — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isUsersAdminDbSqlReady(),
      "Set USERS_ADMIN_DB_SQL_READY=true after confirming Db/users-admin-sql.ts",
    );
  });

  apiDbTest(
    "IND-USE-DB-001 — scaffold DB coverage",
    { tag: ["@users-admin", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runUsersAdminDbCoverage(authenticatedApi, db);
    },
  );
});
