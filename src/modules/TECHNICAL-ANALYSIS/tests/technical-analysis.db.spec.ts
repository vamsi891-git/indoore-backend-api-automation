import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isTechnicalAnalysisDbSqlReady } from "../Db/technical-analysis.db";
import { runTechnicalAnalysisDbCoverage } from "./technical-analysis-db.harness";

apiDbTest.describe("TECHNICAL-ANALYSIS — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(600_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isTechnicalAnalysisDbSqlReady(),
      "Set TECHNICAL_ANALYSIS_DB_SQL_READY=true after confirming Db/technical-analysis-sql.ts",
    );
  });

  apiDbTest(
    "IND-TA-DB-001 — Summary↔report totals + V_Consumerdetails row spot-checks",
    { tag: ["@technical-analysis", "@db", "@technical"] },
    async ({ authenticatedApi, db }) => {
      await runTechnicalAnalysisDbCoverage(authenticatedApi, db);
    },
  );
});
