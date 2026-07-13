import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumerCategoryResponse } from "../Mapper/consumercategory.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface ConsumerCategoryApiResponse {
  rawResponse: APIResponse;
  responseBody: ConsumerCategoryResponse;
  responseTime: number;
}

export class ConsumerCategoryApi {
  static readonly PATH = "/indore/utils/consumer-categories";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getConsumerCategories(): Promise<ConsumerCategoryApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<ConsumerCategoryResponse>(
        this.authenticatedApi,
        ConsumerCategoryApi.PATH,
        "consumer-categories",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
