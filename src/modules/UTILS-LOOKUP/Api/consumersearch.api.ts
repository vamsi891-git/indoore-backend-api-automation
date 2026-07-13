import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  SearchConsumerMapper,
  SearchConsumerResponse,
  type SearchConsumerRawData,
} from "../Mapper/consumersearch.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";
import { getLookupResponseData } from "../utils/lookup-spec.harness";

export interface SearchConsumerApiResponse {
  rawResponse: APIResponse;
  responseBody: SearchConsumerResponse;
  responseTime: number;
}

export interface ConsumerSearchQuery {
  page?: number | string;
  limit?: number;
  q?: string;
  /**
   * Resolve page at runtime as totalPages + 1 on a narrow `q` filter.
   * Unfiltered deep pages hang / 504 on large consumer catalogs.
   */
  beyondTotalPages?: boolean;
}

export class SearchConsumerApi {
  static readonly PATH = "/indore/utils/search/consumers";

  constructor(private authenticatedApi: APIRequestContext) {}

  async searchConsumers(
    query: ConsumerSearchQuery = { page: 1, limit: 20 },
  ): Promise<SearchConsumerApiResponse> {
    if (query.beyondTotalPages) {
      return this.searchBeyondLastPage(query.limit);
    }

    const path = SearchConsumerApi.toPath(query);
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<SearchConsumerResponse>(
        this.authenticatedApi,
        path,
        "consumer-search",
      );
    return { rawResponse, responseBody, responseTime };
  }

  /**
   * Seed a narrow `q`, then request totalPages + 1.
   * Avoids unfiltered deep OFFSET (e.g. page 7000 on 100k+ rows).
   */
  async searchBeyondLastPage(
    limit: number = 20,
  ): Promise<SearchConsumerApiResponse> {
    const seed = await this.searchConsumers({ page: 1, limit: 1 });
    const seedData = SearchConsumerMapper.mapData(
      getLookupResponseData<SearchConsumerRawData>(seed.responseBody),
    );
    const seedItem = seedData.items[0];
    const q =
      seedItem?.consumerCid?.trim() ||
      seedItem?.meterSerialNumber?.trim() ||
      "NOMATCH-EDGE-PAGE";

    const probe = await this.searchConsumers({ page: 1, limit, q });
    const probeData = SearchConsumerMapper.mapData(
      getLookupResponseData<SearchConsumerRawData>(probe.responseBody),
    );
    const page = Math.max(1, probeData.totalPages) + 1;
    return this.searchConsumers({ page, limit, q });
  }

  /** @deprecated Use searchConsumers({ page, limit }) */
  async SearchConsumers(
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchConsumerApiResponse> {
    return this.searchConsumers({ page, limit });
  }

  private static toPath(query: ConsumerSearchQuery): string {
    const params = new URLSearchParams();
    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }
    if (query.q !== undefined && query.q !== "") {
      params.set("q", query.q);
    }
    const qs = params.toString();
    return `${SearchConsumerApi.PATH}${qs ? `?${qs}` : ""}`;
  }
}
