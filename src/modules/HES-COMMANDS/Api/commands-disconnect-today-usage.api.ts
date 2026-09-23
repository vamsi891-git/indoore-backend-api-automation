import { APIRequestContext, APIResponse } from "@playwright/test";
import { DISCONNECT_TODAY_USAGE_PATH } from "../Data/commands-disconnect-today-usage.data";
import { DisconnectTodayUsageResponse } from "../Mapper/commands-disconnect-today-usage.mapper";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsDisconnectTodayUsageApiResult {
  rawResponse: APIResponse;
  responseBody: DisconnectTodayUsageResponse;
  responseTime: number;
}

export class CommandsDisconnectTodayUsageApi {
  constructor(private request: APIRequestContext) {}

  async getTodayUsage(): Promise<CommandsDisconnectTodayUsageApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      DISCONNECT_TODAY_USAGE_PATH,
    );
    const responseBody = await parseCommandsResponseBody<DisconnectTodayUsageResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
