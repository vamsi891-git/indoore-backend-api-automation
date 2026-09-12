import { APIRequestContext, APIResponse } from "@playwright/test";
import { CONSUMPTION_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumptionPatternResponse } from "../Mapper/consumptionpattern.mapper";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";
import type { CommercialRetryConfig } from "../utils/commercial-request.helper";

export interface ConsumptionPatternApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumptionPatternResponse;
  responseTime: number;
}

export class ConsumptionPatternApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getConsumptionPattern(
    params: Record<string, string | number | boolean>,
    retryConfig?: CommercialRetryConfig,
  ): Promise<ConsumptionPatternApiResult> {
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/consumption-pattern",
      { params },
      {
        maxAttempts: 5,
        timeoutMs: CONSUMPTION_REQUEST_TIMEOUT_MS,
        exponentialBackoff: true,
        ...retryConfig,
      },
    );

    const responseBody = (await response
      .json()
      .catch(() => ({}))) as ConsumptionPatternResponse;

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
