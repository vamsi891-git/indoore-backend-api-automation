import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  ConsumerPhaseDistributionResponse,
  type ConsumerPhase,
} from "../Mapper/consumerphasedistribution.mapper";

export type ConsumerPhaseDistributionApiResult =
  ApiCallResult<ConsumerPhaseDistributionResponse>;

export type { ConsumerPhase };

export interface ConsumerPhaseDistributionQuery {
  phase: ConsumerPhase;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export class ConsumerPhaseDistributionApi extends TimedApiClient {
  getConsumerPhaseDistribution(
    query: ConsumerPhaseDistributionQuery,
  ): Promise<ConsumerPhaseDistributionApiResult> {
    const params: Record<string, string | number | boolean> = {
      phase: query.phase,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        key !== "phase" &&
        key !== "page" &&
        key !== "limit"
      ) {
        params[key] = value as string | number | boolean;
      }
    }

    return this.getJson<ConsumerPhaseDistributionResponse>(
      "/indore/dashboard/consumer/phase-distribution",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        params,
      },
    );
  }
}
