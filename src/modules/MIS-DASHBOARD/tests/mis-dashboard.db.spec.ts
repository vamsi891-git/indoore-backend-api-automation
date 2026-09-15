import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isMisDashboardDbSqlReady } from "../Db/mis-dashboard.db";
import { runMisDashboardDbCoverage } from "./mis-dashboard-db.harness";

apiDbTest.describe("Meter counts versus the database", () => {
  apiDbTest.describe.configure({ retries: 0 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isMisDashboardDbSqlReady(),
      "Set MIS_DASHBOARD_DB_SQL_READY=true after confirming Db/mis-dashboard-sql.ts",
    );
  });

  apiDbTest(
    "How many meters we have — cards do not exceed the full meter list",
    { tag: ["@mis-dashboard", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runMisDashboardDbCoverage(authenticatedApi, db);
    },
  );
});
