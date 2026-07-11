import { APIRequestContext, APIResponse } from "@playwright/test";
import { NetworkSearchResponse } from "../Mapper/networksearch.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface NetworkSearchApiResponse {
  rawResponse: APIResponse;
  responseBody: NetworkSearchResponse;
  responseTime: number;
}

export interface NetworkSearchQuery {
  limit?: number;
}

export class NetworkSearchApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async searchNetworks(
    query: NetworkSearchQuery = { limit: 20 },
  ): Promise<NetworkSearchApiResponse> {
    const params = new URLSearchParams();
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }
    const qs = params.toString();
    const path = `/indore/utils/search/networks${qs ? `?${qs}` : ""}`;
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<NetworkSearchResponse>(
        this.authenticatedApi,
        path,
        "network-search",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
