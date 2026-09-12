import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isMisDashboardDbSqlReady } from "../Db/mis-dashboard.db";
import { runMisDashboardDbCoverage } from "./mis-dashboard-db.harness";

apiDbTest.describe("MIS-DASHBOARD — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isMisDashboardDbSqlReady(),
      "Set MIS_DASHBOARD_DB_SQL_READY=true after confirming Db/mis-dashboard-sql.ts",
    );
  });

  apiDbTest(
    "IND-MIS-DB-001 — comm-stats live cards ≤ unscoped meter universe",
    { tag: ["@mis-dashboard", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runMisDashboardDbCoverage(authenticatedApi, db);
    },
  );
});
