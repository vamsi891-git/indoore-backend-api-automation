import { test } from "../../../fixtures/api.fixture";
import { ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { runAssetManagementProductionCoverage } from "./asset-management-coverage.harness";

test.describe("Asset Management — Production Coverage", () => {
  test.describe.configure({ mode: "serial", retries: 2 });
  test.setTimeout(ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS);

  test(
    "Full module coverage — hierarchies, pagination, counts, cross-API alignment",
    { tag: ["@asset-management", "@production", "@coverage"] },
    async ({ authenticatedApi }) => {
      await runAssetManagementProductionCoverage(authenticatedApi);
    },
  );
});
