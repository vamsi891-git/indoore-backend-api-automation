import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  ConsumerConnectionStatusResponse,
  type ConsumerConnectionStatus,
} from "../Mapper/consumerconnectionstatus.mapper";

export type ConsumerConnectionStatusApiResult =
  ApiCallResult<ConsumerConnectionStatusResponse>;

export type { ConsumerConnectionStatus };

export interface ConsumerConnectionStatusQuery {
  status: ConsumerConnectionStatus;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export class ConsumerConnectionStatusApi extends TimedApiClient {
  getConsumerConnectionStatus(
    query: ConsumerConnectionStatusQuery,
  ): Promise<ConsumerConnectionStatusApiResult> {
    const params: Record<string, string | number | boolean> = {
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        key !== "status" &&
        key !== "page" &&
        key !== "limit"
      ) {
        params[key] = value as string | number | boolean;
      }
    }

    return this.getJson<ConsumerConnectionStatusResponse>(
      "/indore/dashboard/consumer/connection-status",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        params,
      },
    );
  }
}
