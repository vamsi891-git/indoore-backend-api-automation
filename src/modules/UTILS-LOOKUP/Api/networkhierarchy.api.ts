import { APIRequestContext, APIResponse } from "@playwright/test";
import { NetworkResponse } from "../Mapper/networkhierarchy.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface NetworkApiResponse {
  rawResponse: APIResponse;
  responseBody: NetworkResponse;
  responseTime: number;
}

export class NetworkApi {
  static readonly PATH = "/indore/utils/hierarchies/network";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getNetworkHierarchy(): Promise<NetworkApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<NetworkResponse>(
        this.authenticatedApi,
        NetworkApi.PATH,
        "network-hierarchy",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
