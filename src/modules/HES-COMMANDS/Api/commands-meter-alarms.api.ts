import { APIRequestContext, APIResponse } from "@playwright/test";
import { METER_ALARMS_PATH } from "../Data/commands-meter-alarms.data";
import type { MeterAlarmsRequestBody } from "../Data/commands-meter-alarms.data";
import { MeterAlarmsResponse } from "../Mapper/commands-meter-alarms.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsMeterAlarmsApiResult {
  rawResponse: APIResponse;
  responseBody: MeterAlarmsResponse;
  responseTime: number;
}

export class CommandsMeterAlarmsApi {
  constructor(private request: APIRequestContext) {}

  async postMeterAlarms(
    body: MeterAlarmsRequestBody,
  ): Promise<CommandsMeterAlarmsApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      METER_ALARMS_PATH,
      body,
    );
    const responseBody =
      await parseCommandsResponseBody<MeterAlarmsResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
