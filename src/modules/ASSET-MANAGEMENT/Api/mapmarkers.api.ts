import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { assetManagementPaths } from "../Data/asset-management.common.data";
import { MapMarkersResponse } from "../Mapper/mapmarkers.mapper";

export interface MapMarkersApiResponse {
  rawResponse: APIResponse;
  responseBody: MapMarkersResponse;
  responseTime: number;
}

export class MapMarkersApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getMapMarkers(
    query: string,
    requestTimeoutMs?: number,
  ): Promise<MapMarkersApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      assetManagementPaths.mapMarkers(query),
      requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
    );
    const responseBody: MapMarkersResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return { rawResponse, responseBody, responseTime };
  }
}
