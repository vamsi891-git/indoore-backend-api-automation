import { APIRequestContext, APIResponse } from "@playwright/test";
import { DtrSearchResponse } from "../Mapper/dtrsearch.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface DtrSearchApiResponse {
  rawResponse: APIResponse;
  responseBody: DtrSearchResponse;
  responseTime: number;
}

export interface DtrSearchQuery {
  page?: number;
  limit?: number;
}

export class DtrSearchApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async searchDtr(
    query: DtrSearchQuery = { page: 1, limit: 20 },
  ): Promise<DtrSearchApiResponse> {
    const params = new URLSearchParams();
    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }
    const qs = params.toString();
    const path = `/indore/utils/search/dtr${qs ? `?${qs}` : ""}`;
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<DtrSearchResponse>(
        this.authenticatedApi,
        path,
        "dtr-search",
      );
    return { rawResponse, responseBody, responseTime };
  }

  /** @deprecated Use searchDtr({ page, limit }) */
  async getDtrSearch(): Promise<DtrSearchApiResponse> {
    return this.searchDtr({ page: 1, limit: 20 });
  }
}
