import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { PatternConsumptionResponse } from "../Mapper/patternconsumption.mapper";

export type PatternConsumptionApiResult = ApiCallResult<PatternConsumptionResponse>;

export class PatternConsumptionApi extends TimedApiClient {
  getPatternConsumption(
    patternType: string,
    page: number,
    limit: number,
    month: number,
    year: number
  ): Promise<PatternConsumptionApiResult> {
    return this.getJson<PatternConsumptionResponse>(
      "/indore/consumption/pattern-consumption",
      {
        params: { patternType, page, limit, month, year }
      }
    );
  }
}
