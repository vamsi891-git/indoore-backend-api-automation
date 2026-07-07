// Api/consumercategory.api.ts

import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumerCategoryResponse } from "../Mapper/consumercategory.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { parseLookupJsonResponse } from "../utils/lookup-api-parse.helper";
export interface ConsumerCategoryApiResponse {
  rawResponse: APIResponse;
  responseBody: ConsumerCategoryResponse;
  responseTime: number;
}
export class ConsumerCategoryApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getConsumerCategories(): Promise<ConsumerCategoryApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/consumer-categories");
    return {
      rawResponse,
      responseBody: await parseLookupJsonResponse<ConsumerCategoryResponse>(
        rawResponse,
        "consumer-categories",
      ),
      responseTime: Date.now() - start
    };
  }
}
