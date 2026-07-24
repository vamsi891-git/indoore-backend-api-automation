import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isEnergyAuditsDbSqlReady } from "../Db/energy-audits.db";
import { runEnergyAuditsDbCoverage } from "./energy-audits-db.harness";

apiDbTest.describe("ENERGY-AUDITS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isEnergyAuditsDbSqlReady(),
      "Set ENERGY_AUDITS_DB_SQL_READY=true after confirming Db/energy-audits-sql.ts",
    );
  });

  apiDbTest(
    "IND-ENE-DB-001 — scaffold DB coverage",
    { tag: ["@energy-audits", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runEnergyAuditsDbCoverage(authenticatedApi, db);
    },
  );
});
