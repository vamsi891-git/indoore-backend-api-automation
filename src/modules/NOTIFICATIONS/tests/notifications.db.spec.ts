import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../extras/db/postgres.client";
import { isNotificationsDbSqlReady } from "../Db/notifications.db";
import { runNotificationsDbCoverage } from "./notifications-db.harness";

apiDbTest.describe("NOTIFICATIONS — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isNotificationsDbSqlReady(),
      "Set NOTIFICATIONS_DB_SQL_READY=true after confirming Db/notifications-sql.ts",
    );
  });

  apiDbTest(
    "IND-NOT-DB-001 — inbox stats + list total + spot vs user_notifications",
    { tag: ["@notifications", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runNotificationsDbCoverage(authenticatedApi, db);
    },
  );
});
