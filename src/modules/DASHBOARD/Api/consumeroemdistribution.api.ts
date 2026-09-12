import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerOemDistributionResponse } from "../Mapper/consumeroemdistribution.mapper";

export type ConsumerOemDistributionApiResult =
  ApiCallResult<ConsumerOemDistributionResponse>;

export interface ConsumerOemDistributionQuery {
  oem: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export class ConsumerOemDistributionApi extends TimedApiClient {
  getConsumerOemDistribution(
    query: ConsumerOemDistributionQuery,
  ): Promise<ConsumerOemDistributionApiResult> {
    const params: Record<string, string | number | boolean> = {
      oem: query.oem,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        key !== "oem" &&
        key !== "page" &&
        key !== "limit"
      ) {
        params[key] = value as string | number | boolean;
      }
    }

    return this.getJson<ConsumerOemDistributionResponse>(
      "/indore/dashboard/consumer/oem-distribution",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        params,
      },
    );
  }
}
