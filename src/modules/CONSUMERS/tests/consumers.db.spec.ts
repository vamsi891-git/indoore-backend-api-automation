import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isConsumersDbSqlReady } from "../Db/consumers.db";
import { runConsumersDbCoverage } from "./consumers-db.harness";

apiDbTest.describe("CONSUMERS — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isConsumersDbSqlReady(),
      "Set CONSUMERS_DB_SQL_READY=true after confirming Db/consumers-sql.ts against live schema",
    );
  });

  apiDbTest(
    "IND-CON-DB-001 — Profile + validate-meter + activation spot-checks vs DB",
    { tag: ["@consumers", "@db", "@profile"] },
    async ({ authenticatedApi, db }) => {
      await runConsumersDbCoverage(authenticatedApi, db);
    },
  );
});
