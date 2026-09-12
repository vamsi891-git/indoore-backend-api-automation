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
} from "../../../core/contract/contract-snapshot.helper";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import { DtrDetailApi } from "../Api/DtrId.api";
import { AssetDtrLookupId } from "../Data/asset-management.common.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
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
function buildHierarchyContractSnapshot(input: {
  pathPattern: string;
  responseBody: unknown;
}): {
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
      const api = new DtrDetailApi(authenticatedApi);
      const { responseBody } = await api.getDtrDetails(AssetDtrLookupId, 1, 20);
      expect(responseBody.success).toBe(true);

      const body = asRecord(responseBody);
      const data = asRecord(body.data);
      const consumers = Array.isArray(data.consumers) ? data.consumers : [];
      const consumerKeys =
        consumers.length > 0
          ? Object.keys(asRecord(consumers[0]))
          : [];

      await assertContractSnapshot(
        "asset-management/dtr-detail",
        buildLookupItemsContractSnapshot({
          pathPattern: `/indore/asset-management/dtr/${AssetDtrLookupId}`,
          dataKeys: Object.keys(data),
          itemKeys: consumerKeys.length > 0 ? consumerKeys : ["consumers"],
        }),
      );
    },
  );
});
