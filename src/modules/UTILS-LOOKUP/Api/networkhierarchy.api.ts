import { APIRequestContext, APIResponse } from "@playwright/test";
import { NetworkResponse } from "../Mapper/networkhierarchy.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface NetworkApiResponse {
  rawResponse: APIResponse;
  responseBody: NetworkResponse;
  responseTime: number;
}

export class NetworkApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getNetworkHierarchy(): Promise<NetworkApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/hierarchies/network");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
