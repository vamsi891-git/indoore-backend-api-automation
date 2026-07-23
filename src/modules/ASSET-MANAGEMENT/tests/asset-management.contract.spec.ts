import { test, expect } from "../../../fixtures/observability.fixture";
import { assertContractSnapshot } from "../../../core/contract/contract-snapshot.helper";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import { DtrDetailApi } from "../Api/DtrId.api";
import { AssetDtrLookupId } from "../Data/asset-management.common.data";

test.describe("Asset Management Contract Snapshots", () => {
  test("Network Hierarchy",
    { tag: ["@asset-management", "@contract-snapshot", "@network-hierarchy"] },
    async ({ authenticatedApi }) => {
      const api = new NetworkHierarchyApi(authenticatedApi);
      const { responseBody } = await api.getNetworkHierarchy();
      expect(responseBody.success).toBe(true);
      await assertContractSnapshot(
        "asset-management/network-hierarchy",
        responseBody,
      );
    },
  );

  test("Organisation Hierarchy",
    {
      tag: [
        "@asset-management",
        "@contract-snapshot",
        "@organisation-hierarchy",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new OrganisationHierarchyApi(authenticatedApi);
      const { responseBody } = await api.getOrganisationHierarchy();
      expect(responseBody.success).toBe(true);
      await assertContractSnapshot(
        "asset-management/organisation-hierarchy",
        responseBody,
      );
    },
  );

  test("DTR Detail",
    { tag: ["@asset-management", "@contract-snapshot", "@dtr-detail"] },
    async ({ authenticatedApi }) => {
      const api = new DtrDetailApi(authenticatedApi);
      const { responseBody } = await api.getDtrDetails(AssetDtrLookupId, 1, 20);
      expect(responseBody.success).toBe(true);
      await assertContractSnapshot("asset-management/dtr-detail", responseBody);
    },
  );
});
