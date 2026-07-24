import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isHesCommandsDbSqlReady } from "../Db/hes-commands.db";
import { runHesCommandsDbCoverage } from "./hes-commands-db.harness";

apiDbTest.describe("HES-COMMANDS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isHesCommandsDbSqlReady(),
      "Set HES_COMMANDS_DB_SQL_READY=true after confirming Db/hes-commands-sql.ts",
    );
  });

  apiDbTest(
    "IND-HES-DB-001 — scaffold DB coverage",
    { tag: ["@hes-commands", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runHesCommandsDbCoverage(authenticatedApi, db);
    },
  );
});
