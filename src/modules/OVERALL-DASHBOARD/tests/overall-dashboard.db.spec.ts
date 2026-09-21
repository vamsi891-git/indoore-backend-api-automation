import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../extras/db/postgres.client";
import { isOverallDashboardDbSqlReady } from "../Db/overall-dashboard.db";
import { runOverallDashboardDbCoverage } from "./overall-dashboard-db.harness";

apiDbTest.describe("OVERALL-DASHBOARD — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(480_000);
  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(!isOverallDashboardDbSqlReady(), "Set OVERALL_DASHBOARD_DB_SQL_READY=true");
  });
  apiDbTest(
    "IND-OD-DB-001 — Home dashboard mapped vs unmapped shares look consistent",
    { tag: ["@overall-dashboard", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runOverallDashboardDbCoverage(authenticatedApi, db);
    },
  );
});
