/**
 * Asset Management contract snapshots — structural only.
 * Hierarchy trees and DTR consumer lists drift in live data; we lock keys/shape,
 * not business values (ids, names, counts, nested DTR rows).
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:asset-management:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../extras/contract/contract-snapshot.helper";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import { DtrDetailApi } from "../Api/DtrId.api";
import { HierarchyChildrenApi } from "../Api/hierarchychildren.api";
import { HierarchySearchApi } from "../Api/hierarchysearch.api";
import { HierarchyTypesApi } from "../Api/hierarchytypes.api";
import { AssetDetailApi } from "../Api/assetdetail.api";
import { AssetExportApi } from "../Api/assetexport.api";
import { MapMarkersApi } from "../Api/mapmarkers.api";
import { hierarchyChildrenQuery } from "../Data/hierarchychildren.data";
import { hierarchySearchQuery } from "../Data/hierarchysearch.data";
import { hierarchyTypesQuery } from "../Data/hierarchytypes.data";
import { assetExportQuery } from "../Data/assetexport.data";
import { mapMarkersQuery } from "../Data/mapmarkers.data";
import { AssetExportMapper } from "../Mapper/assetexport.mapper";
import { resolveLiveDtrLookupId } from "../utils/resolve-dtr-lookup.helper";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

type HierarchyNodeLike = {
  children?: unknown[];
  dtrs?: unknown[];
  [key: string]: unknown;
};

function findFirstDtr(nodes: unknown[]): Record<string, unknown> | null {
  for (const node of nodes) {
    const row = asRecord(node) as HierarchyNodeLike;
    const dtrs = Array.isArray(row.dtrs) ? row.dtrs : [];
    if (dtrs.length > 0) return asRecord(dtrs[0]);
    const children = Array.isArray(row.children) ? row.children : [];
    const nested = findFirstDtr(children);
    if (nested) return nested;
  }
  return null;
}

/**
 * Shape lock for network/organisation hierarchy trees.
 * Captures envelope + node/dtr/meter field names only.
 */
function buildHierarchyContractSnapshot(input: { pathPattern: string; responseBody: unknown }): {
  httpMethod: "GET";
  pathPattern: string;
  successEnvelopeKeys: string[];
  dataKeys: string[];
  nodeKeys: string[];
  dtrKeys: string[];
  dtrMeterKeys: string[];
} {
  const body = asRecord(input.responseBody);
  const data = asRecord(body.data);
  const hierarchy = Array.isArray(data.hierarchy) ? data.hierarchy : [];
  const firstNode = asRecord(hierarchy[0] ?? {});
  const firstDtr = findFirstDtr(hierarchy) ?? {};
  const meter = asRecord(firstDtr.dtrMeter);

  return {
    httpMethod: "GET",
    pathPattern: input.pathPattern,
    successEnvelopeKeys: ["data", "success"].sort(),
    dataKeys: Object.keys(data).sort(),
    nodeKeys: Object.keys(firstNode).sort(),
    dtrKeys: Object.keys(firstDtr).sort(),
    dtrMeterKeys: Object.keys(meter).sort(),
  };
}

test.describe("Asset Management Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Network Hierarchy",
    { tag: ["@asset-management", "@contract-snapshot", "@network-hierarchy"] },
    async ({ authenticatedApi }) => {
      const api = new NetworkHierarchyApi(authenticatedApi);
      const { responseBody } = await api.getNetworkHierarchy();
      expect(responseBody.success).toBe(true);
      await assertContractSnapshot(
        "asset-management/network-hierarchy",
        buildHierarchyContractSnapshot({
          pathPattern: "/indore/asset-management/network-hierarchy",
          responseBody,
        }),
      );
    },
  );

  test(
    "Organisation Hierarchy",
    {
      tag: ["@asset-management", "@contract-snapshot", "@organisation-hierarchy"],
    },
    async ({ authenticatedApi }) => {
      const api = new OrganisationHierarchyApi(authenticatedApi);
      const { responseBody } = await api.getOrganisationHierarchy();
      expect(responseBody.success).toBe(true);
      await assertContractSnapshot(
        "asset-management/organisation-hierarchy",
        buildHierarchyContractSnapshot({
          pathPattern: "/indore/asset-management/organisation-hierarchy",
          responseBody,
        }),
      );
    },
  );

  test(
    "DTR Detail",
    { tag: ["@asset-management", "@contract-snapshot", "@dtr-detail"] },
    async ({ authenticatedApi }) => {
      const dtrId = await resolveLiveDtrLookupId(authenticatedApi);
      test.skip(
        dtrId == null,
        "No DTR in network hierarchy (configured ASSET_DTR_LOOKUP_ID was not found)",
      );
      const api = new DtrDetailApi(authenticatedApi);
      const { responseBody } = await api.getDtrDetails(dtrId as number, 1, 20);
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      const consumers = Array.isArray(data.consumers) ? data.consumers : [];
      const consumerKeys = consumers.length > 0 ? Object.keys(asRecord(consumers[0])) : [];

      await assertContractSnapshot(
        "asset-management/dtr-detail",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/asset-management/dtr/:id",
          dataKeys: Object.keys(data),
          itemKeys: consumerKeys.length > 0 ? consumerKeys : ["consumers"],
        }),
      );
    },
  );

  test(
    "Hierarchy Children",
    {
      tag: ["@asset-management", "@contract-snapshot", "@hierarchy-children"],
    },
    async ({ authenticatedApi }) => {
      const api = new HierarchyChildrenApi(authenticatedApi);
      const { responseBody } = await api.getHierarchyChildren(
        hierarchyChildrenQuery({ mode: "network", page: 1, pageSize: 20 }),
      );
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      const items = Array.isArray(data.items) ? data.items : [];
      const itemKeys = items.length > 0 ? Object.keys(asRecord(items[0])) : [];

      await assertContractSnapshot(
        "asset-management/hierarchy-children",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/asset-management/hierarchy/children",
          dataKeys: Object.keys(data),
          itemKeys: itemKeys.length > 0 ? itemKeys : ["items"],
        }),
      );
    },
  );

  test(
    "Hierarchy Search",
    {
      tag: ["@asset-management", "@contract-snapshot", "@hierarchy-search"],
    },
    async ({ authenticatedApi }) => {
      const api = new HierarchySearchApi(authenticatedApi);
      const { responseBody } = await api.getHierarchySearch(
        hierarchySearchQuery({
          mode: "organisation",
          q: "In",
          page: 1,
          pageSize: 20,
        }),
      );
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      const items = Array.isArray(data.items) ? data.items : [];
      const itemKeys = items.length > 0 ? Object.keys(asRecord(items[0])) : [];

      await assertContractSnapshot(
        "asset-management/hierarchy-search",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/asset-management/hierarchy/search",
          dataKeys: Object.keys(data),
          itemKeys: itemKeys.length > 0 ? itemKeys : ["items"],
        }),
      );
    },
  );

  test(
    "Hierarchy Types",
    {
      tag: ["@asset-management", "@contract-snapshot", "@hierarchy-types"],
    },
    async ({ authenticatedApi }) => {
      const api = new HierarchyTypesApi(authenticatedApi);
      const { responseBody } = await api.getHierarchyTypes(hierarchyTypesQuery("network"));
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      const items = Array.isArray(data.items) ? data.items : [];
      const itemKeys = items.length > 0 ? Object.keys(asRecord(items[0])) : [];

      await assertContractSnapshot(
        "asset-management/hierarchy-types",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/asset-management/hierarchy/types",
          dataKeys: Object.keys(data),
          itemKeys: itemKeys.length > 0 ? itemKeys : ["items"],
        }),
      );
    },
  );

  test(
    "Asset Detail",
    {
      tag: ["@asset-management", "@contract-snapshot", "@asset-detail"],
    },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { responseBody: childrenBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({ mode: "network", page: 1, pageSize: 20 }),
      );
      const rootId = childrenBody.data?.items?.[0]?.id;
      test.skip(rootId == null, "No network roots from hierarchy/children");
      if (rootId == null) return;

      const api = new AssetDetailApi(authenticatedApi);
      const { responseBody } = await api.getAssetDetail("network", rootId);
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "asset-management/asset-detail",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/asset-management/assets/:kind/:id",
          dataKeys: Object.keys(data),
          itemKeys: Object.keys(data),
        }),
      );
    },
  );

  test(
    "Asset Export",
    {
      tag: ["@asset-management", "@contract-snapshot", "@asset-export"],
    },
    async ({ authenticatedApi }) => {
      const api = new AssetExportApi(authenticatedApi);
      const network = await api.getExport(assetExportQuery({ kind: "network" }));
      const organisation = await api.getExport(assetExportQuery({ kind: "organisation" }));
      expect(network.rawResponse.status()).toBe(200);
      expect(organisation.rawResponse.status()).toBe(200);

      await assertContractSnapshot("asset-management/asset-export", {
        httpMethod: "GET",
        pathPattern: "/indore/asset-management/export",
        contentTypeContains: "text/csv",
        networkColumns: AssetExportMapper.mapCsv(network.csvContent).headers,
        organisationColumns: AssetExportMapper.mapCsv(organisation.csvContent).headers,
      });
    },
  );

  test(
    "Map Markers",
    {
      tag: ["@asset-management", "@contract-snapshot", "@map-markers"],
    },
    async ({ authenticatedApi }) => {
      const api = new MapMarkersApi(authenticatedApi);
      const { responseBody } = await api.getMapMarkers(
        mapMarkersQuery({ mode: "network", limit: 50 }),
      );
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      const markers = Array.isArray(data.markers) ? data.markers : [];
      const markerKeys = markers.length > 0 ? Object.keys(asRecord(markers[0])) : [];

      await assertContractSnapshot(
        "asset-management/map-markers",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/asset-management/map-markers",
          dataKeys: Object.keys(data),
          itemKeys: markerKeys.length > 0 ? markerKeys : ["markers"],
        }),
      );
    },
  );
});
