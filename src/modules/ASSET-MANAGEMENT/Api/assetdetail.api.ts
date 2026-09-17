import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { assetManagementPaths } from "../Data/asset-management.common.data";
import type { AssetExplorerKind } from "../Data/assetdetail.data";
import { AssetDetailResponse } from "../Mapper/assetdetail.mapper";

export interface AssetDetailApiResponse {
  rawResponse: APIResponse;
  responseBody: AssetDetailResponse;
  responseTime: number;
}

export class AssetDetailApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getAssetDetail(
    kind: AssetExplorerKind,
    id: number,
    requestTimeoutMs?: number,
  ): Promise<AssetDetailApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      assetManagementPaths.assetDetail(kind, id),
      requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
    );
    const responseBody: AssetDetailResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return { rawResponse, responseBody, responseTime };
  }
}
