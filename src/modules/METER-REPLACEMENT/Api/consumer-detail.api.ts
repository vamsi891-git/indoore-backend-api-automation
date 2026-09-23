import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumerDetailResponse } from "../Mapper/consumer-detail.mapper";
import { encodePathSegment, safeResponseJson, withRateLimitRetry } from "../utils/response.helper";

export interface ConsumerDetailApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumerDetailResponse;
  responseTime: number;
}

export class ConsumerDetailApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getConsumerDetail(consumerId: number | string): Promise<ConsumerDetailApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      this.authenticatedApi.get(
        `/indore/meter-replacement/consumers/${encodePathSegment(String(consumerId))}`,
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<ConsumerDetailResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
