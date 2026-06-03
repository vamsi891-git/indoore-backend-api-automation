// Api/networksearch.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { NetworkSearchResponse } from "../Mapper/networksearch.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface NetworkSearchApiResponse {
  rawResponse: APIResponse;
  responseBody: NetworkSearchResponse;
  responseTime: number;
}
export class NetworkSearchApi {
    constructor(private authenticatedApi: APIRequestContext) {}
  async searchNetworks(limit: number = 20): Promise<NetworkSearchApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,`/indore/utils/search/networks?limit=${limit}`);
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
