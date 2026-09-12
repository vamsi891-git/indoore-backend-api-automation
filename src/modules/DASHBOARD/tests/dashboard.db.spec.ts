import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { DASHBOARD_DB_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isDashboardDbSqlReady } from "../Db/dashboard.db";
import { runDashboardDbCoverage } from "./dashboard-db.harness";

apiDbTest.describe("Dashboard — numbers vs database", () => {
  // No retries: harness is long-running; a retry doubles wall time and often
  // hits disposed request contexts after the parent timeout.
  apiDbTest.describe.configure({ retries: 0 });
  apiDbTest.setTimeout(DASHBOARD_DB_COVERAGE_TEST_TIMEOUT_MS);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isDashboardDbSqlReady(),
      "Set DASHBOARD_DB_SQL_READY=true after confirming Db/dashboard-sql.ts",
    );
  });

  apiDbTest(
    "Dashboard overview numbers match the database",
    { tag: ["@dashboard", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runDashboardDbCoverage(authenticatedApi, db);
    },
  );
});
