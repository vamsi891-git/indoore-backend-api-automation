import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { assetManagementPaths } from "../Data/asset-management.common.data";
import { HierarchySearchResponse } from "../Mapper/hierarchysearch.mapper";

export interface HierarchySearchApiResponse {
  rawResponse: APIResponse;
  responseBody: HierarchySearchResponse;
  responseTime: number;
}

export class HierarchySearchApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getHierarchySearch(
    query: string,
    requestTimeoutMs?: number,
  ): Promise<HierarchySearchApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      assetManagementPaths.hierarchySearch(query),
      requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
    );
    const responseBody: HierarchySearchResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return { rawResponse, responseBody, responseTime };
  }
}
