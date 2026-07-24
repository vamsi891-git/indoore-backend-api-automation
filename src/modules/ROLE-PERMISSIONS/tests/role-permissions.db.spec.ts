import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isRolePermissionsDbSqlReady } from "../Db/role-permissions.db";
import { runRolePermissionsDbCoverage } from "./role-permissions-db.harness";

apiDbTest.describe("ROLE-PERMISSIONS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isRolePermissionsDbSqlReady(),
      "Set ROLE_PERMISSIONS_DB_SQL_READY=true after confirming Db/role-permissions-sql.ts",
    );
  });

  apiDbTest(
    "IND-ROL-DB-001 — scaffold DB coverage",
    { tag: ["@role-permissions", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runRolePermissionsDbCoverage(authenticatedApi, db);
    },
  );
});
