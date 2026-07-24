import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isAuthDbSqlReady } from "../Db/auth.db";
import { runAuthDbCoverage } from "./auth-db.harness";

apiDbTest.describe("AUTH — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isAuthDbSqlReady(),
      "Set AUTH_DB_SQL_READY=true after confirming Db/auth-sql.ts",
    );
  });

  apiDbTest(
    "IND-AUT-DB-001 — Me / devices / invitations vs AuthRepository SQL",
    { tag: ["@auth", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runAuthDbCoverage(authenticatedApi, db);
    },
  );
});
