import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isOverallDashboardDbSqlReady } from "../Db/overall-dashboard.db";
import { runOverallDashboardDbCoverage } from "./overall-dashboard-db.harness";

apiDbTest.describe("OVERALL-DASHBOARD — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);
  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isOverallDashboardDbSqlReady(),
      "Set OVERALL_DASHBOARD_DB_SQL_READY=true",
    );
  });
  apiDbTest(
    "IND-OD-DB-001 — Metrics network counts ≤ DB universe",
    { tag: ["@overall-dashboard", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runOverallDashboardDbCoverage(authenticatedApi, db);
    },
  );
});
