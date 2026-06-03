// Api/consumercategory.api.ts

import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumerCategoryResponse } from "../Mapper/consumercategory.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
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
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
