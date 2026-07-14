import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { ConsumerSearchResponse } from "../Mapper/consumer-search.mapper";
import {
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

export interface ConsumerSearchApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumerSearchResponse;
  responseTime: number;
}

export class ConsumerSearchApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async searchConsumer(search: string): Promise<ConsumerSearchApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/consumers/search",
        {
          params: {
            search,
          },
        },
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<ConsumerSearchResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
