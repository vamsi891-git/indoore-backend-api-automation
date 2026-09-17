import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { assetManagementPaths } from "../Data/asset-management.common.data";
import { HierarchyChildrenResponse } from "../Mapper/hierarchychildren.mapper";

export interface HierarchyChildrenApiResponse {
  rawResponse: APIResponse;
  responseBody: HierarchyChildrenResponse;
  responseTime: number;
}

export class HierarchyChildrenApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getHierarchyChildren(
    query: string,
    requestTimeoutMs?: number,
  ): Promise<HierarchyChildrenApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      assetManagementPaths.hierarchyChildren(query),
      requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
    );
    const responseBody: HierarchyChildrenResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return { rawResponse, responseBody, responseTime };
  }
}
