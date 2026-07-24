import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isCommericialAnalysisDbSqlReady } from "../Db/commericial-analysis.db";
import { runCommericialAnalysisDbCoverage } from "./commericial-analysis-db.harness";

apiDbTest.describe("COMMERICIAL-ANALYSIS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isCommericialAnalysisDbSqlReady(),
      "Set COMMERICIAL_ANALYSIS_DB_SQL_READY=true after confirming Db/commericial-analysis-sql.ts",
    );
  });

  apiDbTest(
    "IND-COM-DB-001 — scaffold DB coverage",
    { tag: ["@commericial-analysis", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runCommericialAnalysisDbCoverage(authenticatedApi, db);
    },
  );
});
