import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  METER_LOCATION_PATH,
  MeterLocationRequestBody,
} from "../Data/commands-meter-location.data";
import { MeterLocationResponse } from "../Mapper/commands-meter-location.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsMeterLocationApiResult {
  rawResponse: APIResponse;
  responseBody: MeterLocationResponse;
  responseTime: number;
}

export class CommandsMeterLocationApi {
  constructor(private request: APIRequestContext) {}

  async postMeterLocation(
    body: MeterLocationRequestBody,
  ): Promise<CommandsMeterLocationApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      METER_LOCATION_PATH,
      body,
    );
    const responseBody =
      await parseCommandsResponseBody<MeterLocationResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
