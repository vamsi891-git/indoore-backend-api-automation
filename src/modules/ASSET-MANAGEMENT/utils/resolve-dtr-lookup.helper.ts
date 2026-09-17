import type { APIRequestContext } from "@playwright/test";
import { DtrDetailApi } from "../Api/DtrId.api";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import {
  AssetDtrLookupId,
  assetManagementHierarchyRequestTimeoutMs,
  DtrDetailPaginationQueries,
} from "../Data/asset-management.common.data";
import { NetworkHierarchyMapper } from "../Mapper/networkhierarchy.mapper";
import {
  findDtrById,
  findDtrWithHighestConsumerCount,
} from "./asset-management.helper";

export async function resolveLiveDtrLookupId(
  authenticatedApi: APIRequestContext,
): Promise<number | undefined> {
  const detailApi = new DtrDetailApi(authenticatedApi);
  const configured = await detailApi.getDtrDetails(
    AssetDtrLookupId,
    DtrDetailPaginationQueries.default.page,
    DtrDetailPaginationQueries.default.limit,
  );
  if (configured.responseBody?.success && configured.responseBody.data) {
    return AssetDtrLookupId;
  }

  const networkApi = new NetworkHierarchyApi(authenticatedApi);
  const network = await networkApi.getNetworkHierarchy(
    undefined,
    assetManagementHierarchyRequestTimeoutMs,
  );
  if (!network.responseBody?.success || !network.responseBody.data) {
    return undefined;
  }

  const hierarchy = NetworkHierarchyMapper.mapData(
    network.responseBody.data,
  ).hierarchy;
  return (
    findDtrWithHighestConsumerCount(hierarchy)?.networkLookupId ??
    findDtrById(hierarchy)?.networkLookupId
  );
}
