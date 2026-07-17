import { APIRequestContext, APIResponse } from "@playwright/test";
import { CONSUMPTION_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumptionCompareResponse } from "../Mapper/consumptioncompare.mapper";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";

export interface ConsumptionCompareApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumptionCompareResponse;
  responseTime: number;
}

export class ConsumptionCompareApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getConsumptionCompare(
    params: Record<string, string | number | boolean>,
  ): Promise<ConsumptionCompareApiResult> {
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/consumption-compare",
      { params },
      {
        maxAttempts: 5,
        timeoutMs: CONSUMPTION_REQUEST_TIMEOUT_MS,
        exponentialBackoff: true,
      },
    );

    const responseBody = (await response
      .json()
      .catch(() => ({}))) as ConsumptionCompareResponse;

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
