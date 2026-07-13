import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  DtrSearchMapper,
  DtrSearchResponse,
  type DtrSearchRawData,
} from "../Mapper/dtrsearch.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";
import { getLookupResponseData } from "../utils/lookup-spec.harness";

export interface DtrSearchApiResponse {
  rawResponse: APIResponse;
  responseBody: DtrSearchResponse;
  responseTime: number;
}

export interface DtrSearchQuery {
  page?: number;
  limit?: number;
  /** Resolve page at runtime as totalPages + 1. */
  beyondTotalPages?: boolean;
}

export class DtrSearchApi {
  static readonly PATH = "/indore/utils/search/dtr";

  constructor(private authenticatedApi: APIRequestContext) {}

  async searchDtr(
    query: DtrSearchQuery = { page: 1, limit: 20 },
  ): Promise<DtrSearchApiResponse> {
    if (query.beyondTotalPages) {
      return this.searchBeyondLastPage(query.limit);
    }

    const path = DtrSearchApi.toPath(query);
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<DtrSearchResponse>(
        this.authenticatedApi,
        path,
        "dtr-search",
      );
    return { rawResponse, responseBody, responseTime };
  }

  async searchBeyondLastPage(
    limit: number = 20,
  ): Promise<DtrSearchApiResponse> {
    const probe = await this.searchDtr({ page: 1, limit });
    const probeData = DtrSearchMapper.mapData(
      getLookupResponseData<DtrSearchRawData>(probe.responseBody),
    );
    const page = Math.max(1, probeData.totalPages) + 1;
    return this.searchDtr({ page, limit });
  }

  /** @deprecated Use searchDtr({ page, limit }) */
  async getDtrSearch(): Promise<DtrSearchApiResponse> {
    return this.searchDtr({ page: 1, limit: 20 });
  }

  private static toPath(query: {
    page?: number | string;
    limit?: number;
  }): string {
    const params = new URLSearchParams();
    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }
    const qs = params.toString();
    return `${DtrSearchApi.PATH}${qs ? `?${qs}` : ""}`;
  }
}
