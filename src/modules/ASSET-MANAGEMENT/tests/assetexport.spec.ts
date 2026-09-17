import { test } from "../../../../src/fixtures/api.fixture";
import { ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AssetExportApi } from "../Api/assetexport.api";
import { HierarchyChildrenApi } from "../Api/hierarchychildren.api";
import {
  AssetExportSearchQueries,
  assetExportQuery,
} from "../Data/assetexport.data";
import { hierarchyChildrenQuery } from "../Data/hierarchychildren.data";
import { runAssetExportValidation } from "./assetexport.harness";

test.describe("Asset Export API", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS);

  let networkRootId: number | undefined;
  let organisationRootId: number | undefined;

  test(
    "GET /asset-management/export — kind=network",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { responseBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({ mode: "network", page: 1, pageSize: 20 }),
      );
      networkRootId = responseBody.data?.items?.[0]?.id;

      await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({ kind: "network" }),
        kind: "network",
        testLabel: "Asset Export — Network",
      });
    },
  );

  test(
    "GET /asset-management/export — kind=organisation",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { responseBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({
          mode: "organisation",
          page: 1,
          pageSize: 20,
        }),
      );
      organisationRootId = responseBody.data?.items?.[0]?.id;

      await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({ kind: "organisation" }),
        kind: "organisation",
        testLabel: "Asset Export — Organisation",
      });
    },
  );

  test(
    "GET /asset-management/export — kind=network&q",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({
          kind: "network",
          q: AssetExportSearchQueries.network,
        }),
        kind: "network",
        testLabel: "Asset Export — Network q",
        q: AssetExportSearchQueries.network,
      });
    },
  );

  test(
    "GET /asset-management/export — kind=organisation&q",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({
          kind: "organisation",
          q: AssetExportSearchQueries.organisation,
        }),
        kind: "organisation",
        testLabel: "Asset Export — Organisation q",
        q: AssetExportSearchQueries.organisation,
      });
    },
  );

  test(
    "GET /asset-management/export — kind=network&hierarchyId root",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      if (networkRootId == null) {
        test.skip(true, "No network roots from hierarchy/children");
        return;
      }
      await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({
          kind: "network",
          hierarchyId: networkRootId,
        }),
        kind: "network",
        testLabel: "Asset Export — Network hierarchyId",
        requireRows: false,
      });
    },
  );

  test(
    "GET /asset-management/export — kind=organisation&hierarchyId root",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      if (organisationRootId == null) {
        test.skip(true, "No organisation roots from hierarchy/children");
        return;
      }
      await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({
          kind: "organisation",
          hierarchyId: organisationRootId,
        }),
        kind: "organisation",
        testLabel: "Asset Export — Organisation hierarchyId",
        requireRows: false,
      });
    },
  );

  test(
    "GET /asset-management/export — q no match returns header-only CSV",
    { tag: ["@smoke", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      const { data } = await runAssetExportValidation({
        api: new AssetExportApi(authenticatedApi),
        query: assetExportQuery({
          kind: "network",
          q: AssetExportSearchQueries.noMatch,
        }),
        kind: "network",
        testLabel: "Asset Export — Network q no match",
        requireRows: false,
        q: AssetExportSearchQueries.noMatch,
      });
      if (data.items.length > 0) {
        throw new Error(
          `Expected no CSV rows for q=${AssetExportSearchQueries.noMatch}`,
        );
      }
    },
  );
});
