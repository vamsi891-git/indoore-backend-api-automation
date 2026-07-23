import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isMeterReplacementDbSqlReady } from "../Db/meter-replacement.db";
import { runMeterReplacementDbCoverage } from "./meter-replacement-db.harness";
apiDbTest.describe("METER-REPLACEMENT — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);
  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isMeterReplacementDbSqlReady(),
      "Set METER_REPLACEMENT_DB_SQL_READY=true after confirming Db/meter-replacement-sql.ts",
    );
  });

  apiDbTest("IND-MR-DB-001 — Dashboard / consumer / meter / history / submission vs DB",
    { tag: ["@meter-replacement", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runMeterReplacementDbCoverage(authenticatedApi, db);
    },
  );
});
