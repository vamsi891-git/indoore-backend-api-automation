import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isDashboardDbSqlReady } from "../Db/dashboard.db";
import { runDashboardDbCoverage } from "./dashboard-db.harness";

apiDbTest.describe("DASHBOARD — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isDashboardDbSqlReady(),
      "Set DASHBOARD_DB_SQL_READY=true after confirming Db/dashboard-sql.ts",
    );
  });

  apiDbTest(
    "IND-DB-DB-001 — Metrics network counts + DTR summary ≤ DB universe",
    { tag: ["@dashboard", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runDashboardDbCoverage(authenticatedApi, db);
    },
  );
});
