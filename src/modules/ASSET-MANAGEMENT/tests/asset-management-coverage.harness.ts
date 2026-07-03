import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DtrDetailApi } from "../Api/DtrId.api";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import {
  AssetDtrLookupId,
  AssetNetworkRootLookupId,
  AssetOrgRootLookupId,
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
  DtrDetailPaginationQueries,
} from "../Data/asset-management.common.data";
import type { DtrNode } from "../Mapper/networkhierarchy.mapper";
import type { NetworkNode } from "../Mapper/networkhierarchy.mapper";
import { DtrDetailMapper } from "../Mapper/dtrId.mapper";
import { AssetManagementCoverageValidator } from "../Validator/asset-management-coverage.validator";
import { NetworkHierarchyValidator } from "../Validator/networkhierarchy.validator";
import { OrganisationHierarchyValidator } from "../Validator/organizationhierarchy.validator";
import {
  findDtrById,
  findDtrWithHighestConsumerCount,
  findFirstNetworkRootId,
  findFirstOrganisationRootId,
} from "../utils/asset-management.helper";
import { runNetworkHierarchyValidation } from "./network-hierarchy.harness";
import { runOrganisationHierarchyValidation } from "./organisation-hierarchy.harness";
import { runDtrDetailValidation } from "./dtr-detail.harness";

const hierarchyOptions = {
  maxResponseTimeMs: assetManagementHierarchyMaxResponseTimeMs,
  requestTimeoutMs: assetManagementHierarchyRequestTimeoutMs,
};

/**
 * Production coverage — one hierarchy fetch each; subtree checks run in-memory.
 */
export async function runAssetManagementProductionCoverage(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  const crossChecks = new ValidationEngine();
  const networkApi = new NetworkHierarchyApi(authenticatedApi);
  const orgApi = new OrganisationHierarchyApi(authenticatedApi);
  const dtrApi = new DtrDetailApi(authenticatedApi);

  const networkResult = await runNetworkHierarchyValidation({
    api: networkApi,
    testLabel: "Production Coverage — Network Hierarchy",
    ...hierarchyOptions,
  });

  const resolvedNetworkRootId =
    AssetNetworkRootLookupId > 0
      ? AssetNetworkRootLookupId
      : findFirstNetworkRootId(networkResult.hierarchy);

  if (resolvedNetworkRootId != null) {
    crossChecks.execute("Network Subtree Root", () => {
      new NetworkHierarchyValidator().validateSubtreeRoot(
        networkResult.hierarchy,
        resolvedNetworkRootId,
      );
    });
  }

  const orgResult = await runOrganisationHierarchyValidation({
    api: orgApi,
    testLabel: "Production Coverage — Organisation Hierarchy",
    ...hierarchyOptions,
  });

  const resolvedOrgRootId =
    AssetOrgRootLookupId > 0
      ? AssetOrgRootLookupId
      : findFirstOrganisationRootId(orgResult.hierarchy);

  if (resolvedOrgRootId != null) {
    crossChecks.execute("Organisation Subtree Root", () => {
      new OrganisationHierarchyValidator().validateSubtreeRoot(
        orgResult.hierarchy,
        resolvedOrgRootId,
      );
    });
  }

  const dtrId = resolveCoverageDtrId(networkResult.hierarchy);
  const networkDtr = findDtrById(networkResult.hierarchy, dtrId);
  const orgDtr = findDtrById(orgResult.hierarchy, dtrId);
  const defaultQuery = DtrDetailPaginationQueries.default;

  const page1 = await runDtrDetailValidation({
    api: dtrApi,
    dtrId,
    page: defaultQuery.page,
    limit: defaultQuery.limit,
    testLabel: "Production Coverage — DTR Page 1",
  });

  crossChecks.execute("Hierarchy Count vs Detail Total", () => {
    if (!networkDtr) {
      throw new Error(`DTR ${dtrId} not found in network hierarchy`);
    }
    AssetManagementCoverageValidator.validateHierarchyCountMatchesDetailTotal(
      networkDtr,
      page1.data,
    );
  });

  if (orgDtr && networkDtr) {
    crossChecks.execute("Network vs Organisation DTR Counts", () => {
      AssetManagementCoverageValidator.validateOrgNetworkDtrCountsAlign(
        networkDtr,
        orgDtr,
      );
    });
  }

  if (page1.data.totalPages >= 2) {
    const page2 = await runDtrDetailValidation({
      api: dtrApi,
      dtrId,
      page: DtrDetailPaginationQueries.page2.page,
      limit: DtrDetailPaginationQueries.page2.limit,
      testLabel: "Production Coverage — DTR Page 2",
    });

    crossChecks.execute("Cross-Page Consumer Uniqueness", () => {
      AssetManagementCoverageValidator.validateCrossPageConsumerIds(
        page1.data.consumers.map((c) => c.consumerTblRefId),
        page2.data.consumers.map((c) => c.consumerTblRefId),
      );
    });
  }

  await runDtrDetailValidation({
    api: dtrApi,
    dtrId,
    page: DtrDetailPaginationQueries.smallPage.page,
    limit: DtrDetailPaginationQueries.smallPage.limit,
    testLabel: "Production Coverage — DTR Limit 10",
  });

  await runDtrDetailValidation({
    api: dtrApi,
    dtrId,
    page: DtrDetailPaginationQueries.beyondTotal.page,
    limit: DtrDetailPaginationQueries.beyondTotal.limit,
    testLabel: "Production Coverage — DTR Beyond Total Pages",
    skipConsumerChecks: true,
  });

  if (page1.data.totalPages >= 1) {
    await runDtrDetailValidation({
      api: dtrApi,
      dtrId,
      page: page1.data.totalPages,
      limit: defaultQuery.limit,
      testLabel: `Production Coverage — DTR Last Page (${page1.data.totalPages})`,
      validateLastPage: true,
    });
  }

  const emptyDtr = findZeroConsumerDtr(networkResult.hierarchy);
  if (emptyDtr) {
    const emptyDetail = await dtrApi.getDtrDetails(
      emptyDtr.networkLookupId,
      defaultQuery.page,
      defaultQuery.limit,
    );
    const emptyData = DtrDetailMapper.mapData(emptyDetail.responseBody.data);
    crossChecks.execute("Zero-Consumer DTR Contract", () => {
      AssetManagementCoverageValidator.validateZeroTotalContract(emptyData);
    });
  }

  crossChecks.printSummary("Asset Management Cross-API Coverage", 0);
}

function resolveCoverageDtrId(hierarchy: NetworkNode[]): number {
  if (process.env.ASSET_DTR_LOOKUP_ID) {
    return AssetDtrLookupId;
  }
  return findDtrWithHighestConsumerCount(hierarchy)?.networkLookupId ?? AssetDtrLookupId;
}

function findZeroConsumerDtr(nodes: NetworkNode[]): DtrNode | undefined {
  let found: DtrNode | undefined;
  const walk = (items: NetworkNode[]) => {
    items.forEach((node) => {
      for (const dtr of node.dtrs ?? []) {
        if (dtr.consumerCount === 0) {
          found = dtr;
        }
      }
      if (node.children.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return found;
}
