import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { assetManagementPaths } from "../Data/asset-management.common.data";

export interface AssetExportApiResponse {
  rawResponse: APIResponse;
  csvContent: string;
  responseTime: number;
}

export class AssetExportApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getExport(
    query: string,
    requestTimeoutMs?: number,
  ): Promise<AssetExportApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      assetManagementPaths.export(query),
      {
        headers: { Accept: "text/csv" },
        ...(requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {}),
      },
    );
    const csvContent = await rawResponse.text();
    const responseTime = Date.now() - start;
    return { rawResponse, csvContent, responseTime };
  }
}
