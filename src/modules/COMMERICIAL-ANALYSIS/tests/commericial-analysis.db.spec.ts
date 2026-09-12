import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { COMMERCIAL_ANALYSIS_DB_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isCommericialAnalysisDbSqlReady } from "../Db/commericial-analysis.db";
import { runCommericialAnalysisDbCoverage } from "./commericial-analysis-db.harness";

apiDbTest.describe("Commercial Analysis — meter details vs database", () => {
  apiDbTest.describe.configure({ retries: 0 });
  apiDbTest.setTimeout(COMMERCIAL_ANALYSIS_DB_COVERAGE_TEST_TIMEOUT_MS);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isCommericialAnalysisDbSqlReady(),
      "Set COMMERICIAL_ANALYSIS_DB_SQL_READY=true after confirming Db/commericial-analysis-sql.ts",
    );
  });

  apiDbTest(
    "Dashboard totals match the detailed reports and the billing database",
    { tag: ["@commericial-analysis", "@db"] },
    async ({ authenticatedApi, db, archiveDb }) => {
      await runCommericialAnalysisDbCoverage(authenticatedApi, db, archiveDb);
    },
  );
});
