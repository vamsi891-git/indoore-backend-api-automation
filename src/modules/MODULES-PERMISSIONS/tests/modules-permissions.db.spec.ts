import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isModulesPermissionsDbSqlReady } from "../Db/modules-permissions.db";
import { runModulesPermissionsDbCoverage } from "./modules-permissions-db.harness";

apiDbTest.describe("MODULES-PERMISSIONS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isModulesPermissionsDbSqlReady(),
      "Set MODULES_PERMISSIONS_DB_SQL_READY=true after confirming Db/modules-permissions-sql.ts",
    );
  });

  apiDbTest(
    "IND-MOD-DB-001 — scaffold DB coverage",
    { tag: ["@modules-permissions", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runModulesPermissionsDbCoverage(authenticatedApi, db);
    },
  );
});
