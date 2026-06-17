import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { PatternConsumptionResponse } from "../Mapper/patternconsumption.mapper";
import { getConsumptionWithRetry } from "../utils/consumption-request.helper";

export type PatternConsumptionApiResult = ApiCallResult<PatternConsumptionResponse>;

export class PatternConsumptionApi extends TimedApiClient {
  async getPatternConsumption(
    patternType: string,
    page: number,
    limit: number,
    month: number,
    year: number
  ): Promise<PatternConsumptionApiResult> {
    const { response, responseTime } = await getConsumptionWithRetry(
      this.authenticatedApi,
      "/indore/consumption/pattern-consumption",
      {
        params: { patternType, page, limit, month, year },
      },
    );
    const text = await response.text();
    let responseBody: PatternConsumptionResponse;
    if (!text) {
      responseBody = { success: false };
    } else {
      responseBody = JSON.parse(text) as PatternConsumptionResponse;
    }
    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
