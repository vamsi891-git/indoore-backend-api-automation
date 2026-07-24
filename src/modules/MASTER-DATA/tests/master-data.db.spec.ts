import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isMasterDataDbSqlReady } from "../Db/master-data.db";
import { runMasterDataDbCoverage } from "./master-data-db.harness";

apiDbTest.describe("MASTER-DATA — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isMasterDataDbSqlReady(),
      "Set MASTER_DATA_DB_SQL_READY=true after confirming Db/master-data-sql.ts",
    );
  });

  apiDbTest(
    "IND-MD-DB-001 — Meter / DTR / consumer / feeder / substation / communication vs DB",
    { tag: ["@master-data", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runMasterDataDbCoverage(authenticatedApi, db);
    },
  );
});
