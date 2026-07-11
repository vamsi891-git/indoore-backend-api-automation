import { APIRequestContext, APIResponse } from "@playwright/test";
import { NetworkResponse } from "../Mapper/networkhierarchy.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface NetworkApiResponse {
  rawResponse: APIResponse;
  responseBody: NetworkResponse;
  responseTime: number;
}

export class NetworkApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getNetworkHierarchy(): Promise<NetworkApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<NetworkResponse>(
        this.authenticatedApi,
        "/indore/utils/hierarchies/network",
        "network-hierarchy",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
