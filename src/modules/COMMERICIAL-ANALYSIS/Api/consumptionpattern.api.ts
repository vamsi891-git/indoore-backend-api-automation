import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumptionPatternResponse } from "../Mapper/consumptionpattern.mapper";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";

export interface ConsumptionPatternApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumptionPatternResponse;
  responseTime: number;
}

export class ConsumptionPatternApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getConsumptionPattern(
    params: Record<string, string | number | boolean>,
  ): Promise<ConsumptionPatternApiResult> {
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/consumption-pattern",
      { params },
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
