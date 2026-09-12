import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isMasterDataDbSqlReady } from "../Db/master-data.db";
import { runMasterDataDbCoverage } from "./master-data-db.harness";

apiDbTest.describe("Master data — lists vs database", () => {
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
    "Meter, DTR, consumer, feeder, and substation lists match the database",
    { tag: ["@master-data", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runMasterDataDbCoverage(authenticatedApi, db);
    },
  );
});
