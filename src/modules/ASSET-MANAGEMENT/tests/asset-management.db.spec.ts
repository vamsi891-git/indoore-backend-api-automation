import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { runAssetManagementDbCoverage } from "./asset-management-db.harness";

apiDbTest.describe("Asset Management — DB Coverage", () => {
  apiDbTest.describe.configure({ retries: 1 });
  apiDbTest.setTimeout(180_000);

  apiDbTest(
    "API counts and spot checks align with PostgreSQL",
    { tag: ["@asset-management", "@db", "@coverage"] },
    async ({ authenticatedApi, db }) => {
      await runAssetManagementDbCoverage(authenticatedApi, db);
    },
  );
});
