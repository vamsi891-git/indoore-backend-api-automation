import { APIRequestContext, APIResponse } from "@playwright/test";
import { SearchConsumerResponse } from "../Mapper/consumersearch.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface SearchConsumerApiResponse {
  rawResponse: APIResponse;
  responseBody: SearchConsumerResponse;
  responseTime: number;
}

export interface ConsumerSearchQuery {
  page?: number | string;
  limit?: number;
}

export class SearchConsumerApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async searchConsumers(
    query: ConsumerSearchQuery = { page: 1, limit: 20 },
  ): Promise<SearchConsumerApiResponse> {
    const params = new URLSearchParams();
    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }
    const qs = params.toString();
    const path = `/indore/utils/search/consumers${qs ? `?${qs}` : ""}`;
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<SearchConsumerResponse>(
        this.authenticatedApi,
        path,
        "consumer-search",
      );
    return { rawResponse, responseBody, responseTime };
  }

  /** @deprecated Use searchConsumers({ page, limit }) */
  async SearchConsumers(
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchConsumerApiResponse> {
    return this.searchConsumers({ page, limit });
  }
}
