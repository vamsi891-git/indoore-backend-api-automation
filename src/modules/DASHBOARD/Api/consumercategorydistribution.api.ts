import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerCategoryDistributionResponse } from "../Mapper/consumercategorydistribution.mapper";

export type ConsumerCategoryDistributionApiResult =
  ApiCallResult<ConsumerCategoryDistributionResponse>;

export interface ConsumerCategoryDistributionQuery {
  category: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export class ConsumerCategoryDistributionApi extends TimedApiClient {
  getConsumerCategoryDistribution(
    query: ConsumerCategoryDistributionQuery,
  ): Promise<ConsumerCategoryDistributionApiResult> {
    const params: Record<string, string | number | boolean> = {
      category: query.category,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        key !== "category" &&
        key !== "page" &&
        key !== "limit"
      ) {
        params[key] = value as string | number | boolean;
      }
    }

    return this.getJson<ConsumerCategoryDistributionResponse>(
      "/indore/dashboard/consumer/category-distribution",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        params,
      },
    );
  }
}
