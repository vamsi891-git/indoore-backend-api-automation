import { test } from "../../../../src/fixtures/api.fixture";
import { ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AssetDetailApi } from "../Api/assetdetail.api";
import { HierarchyChildrenApi } from "../Api/hierarchychildren.api";
import {
  HierarchyChildrenPaginationQueries,
  hierarchyChildrenQuery,
} from "../Data/hierarchychildren.data";
import { resolveLiveDtrLookupId } from "../utils/resolve-dtr-lookup.helper";
import { runAssetDetailValidation } from "./assetdetail.harness";

test.describe("Asset Detail API", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS);

  let networkChildId: number | undefined;

  test(
    "GET /asset-management/assets/network/:id — root",
    { tag: ["@smoke", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { page, pageSize } = HierarchyChildrenPaginationQueries.default;
      const { responseBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({ mode: "network", page, pageSize }),
      );
      const root = responseBody.data?.items?.[0];
      if (root == null) {
        test.skip(true, "No network roots from hierarchy/children");
        return;
      }
      if (root.hasChildren) {
        const childPage = await childrenApi.getHierarchyChildren(
          hierarchyChildrenQuery({
            mode: "network",
            page,
            pageSize,
            parentId: root.id,
          }),
        );
        networkChildId = childPage.responseBody.data?.items?.[0]?.id;
      }

      await runAssetDetailValidation({
        api: new AssetDetailApi(authenticatedApi),
        kind: "network",
        id: root.id,
        testLabel: "Asset Detail — Network root",
      });
    },
  );

  test(
    "GET /asset-management/assets/network/:id — child",
    { tag: ["@smoke", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      if (networkChildId == null) {
        test.skip(true, "No network child under the first root");
        return;
      }
      await runAssetDetailValidation({
        api: new AssetDetailApi(authenticatedApi),
        kind: "network",
        id: networkChildId,
        testLabel: "Asset Detail — Network child",
      });
    },
  );

  test(
    "GET /asset-management/assets/organisation/:id — root",
    { tag: ["@smoke", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { page, pageSize } = HierarchyChildrenPaginationQueries.default;
      const { responseBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({ mode: "organisation", page, pageSize }),
      );
      const root = responseBody.data?.items?.[0];
      if (root == null) {
        test.skip(true, "No organisation roots from hierarchy/children");
        return;
      }

      await runAssetDetailValidation({
        api: new AssetDetailApi(authenticatedApi),
        kind: "organisation",
        id: root.id,
        testLabel: "Asset Detail — Organisation root",
      });
    },
  );

  test(
    "GET /asset-management/assets/dtr/:id",
    { tag: ["@smoke", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      const dtrId = await resolveLiveDtrLookupId(authenticatedApi);
      if (dtrId == null) {
        test.skip(
          true,
          "No DTR in network hierarchy (configured ASSET_DTR_LOOKUP_ID was not found)",
        );
        return;
      }
      await runAssetDetailValidation({
        api: new AssetDetailApi(authenticatedApi),
        kind: "dtr",
        id: dtrId,
        testLabel: "Asset Detail — DTR",
      });
    },
  );
});
