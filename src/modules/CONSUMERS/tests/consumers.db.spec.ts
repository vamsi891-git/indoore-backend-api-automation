import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../extras/db/postgres.client";
import { isConsumersDbSqlReady } from "../Db/consumers.db";
import { runConsumersDbCoverage } from "./consumers-db.harness";

apiDbTest.describe("Consumers — screen data matches the database", () => {
  apiDbTest.describe.configure({ retries: 0 });
  apiDbTest.setTimeout(180_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isConsumersDbSqlReady(),
      "Set CONSUMERS_DB_SQL_READY=true after confirming Db/consumers-sql.ts against live schema",
    );
  });

  apiDbTest(
    "Consumers — profile, meter, billing, communication and live readings match the database",
    { tag: ["@consumers", "@db", "@profile"] },
    async ({ authenticatedApi, db, archiveDb }) => {
      await runConsumersDbCoverage(authenticatedApi, db, archiveDb);
    },
  );
});
