import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { isUsersProfileImageDbSqlReady } from "../Db/users-profile-image.db";
import { runUsersProfileImageDbCoverage } from "./users-profile-image-db.harness";

apiDbTest.describe("USERS-PROFILE-IMAGE — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !isUsersProfileImageDbSqlReady(),
      "Set USERS_PROFILE_IMAGE_DB_SQL_READY=true after confirming Db/users-profile-image-sql.ts",
    );
  });

  apiDbTest(
    "IND-USE-DB-001 — scaffold DB coverage",
    { tag: ["@users-profile-image", "@db"] },
    async ({ authenticatedApi, db }) => {
      await runUsersProfileImageDbCoverage(authenticatedApi, db);
    },
  );
});
