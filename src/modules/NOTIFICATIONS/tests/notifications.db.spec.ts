import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isNotificationsDbSqlReady } from "../Db/notifications.db";
import { runNotificationsDbCoverage } from "./notifications-db.harness";

apiDbTest.describe("NOTIFICATIONS — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isNotificationsDbSqlReady(),
      "Set NOTIFICATIONS_DB_SQL_READY=true after confirming Db/notifications-sql.ts",
    );
  });

  apiDbTest(
    "IND-NOT-DB-001 — scaffold DB coverage",
    { tag: ["@notifications", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runNotificationsDbCoverage(authenticatedApi, db);
    },
  );
});
