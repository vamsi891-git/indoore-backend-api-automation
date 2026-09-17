import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { assetManagementPaths } from "../Data/asset-management.common.data";
import { HierarchyTypesResponse } from "../Mapper/hierarchytypes.mapper";

export interface HierarchyTypesApiResponse {
  rawResponse: APIResponse;
  responseBody: HierarchyTypesResponse;
  responseTime: number;
}

export class HierarchyTypesApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getHierarchyTypes(
    query: string,
    requestTimeoutMs?: number,
  ): Promise<HierarchyTypesApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      assetManagementPaths.hierarchyTypes(query),
      requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
    );
    const responseBody: HierarchyTypesResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return { rawResponse, responseBody, responseTime };
  }
}
