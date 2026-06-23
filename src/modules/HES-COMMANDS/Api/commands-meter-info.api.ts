import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommandsMeterInfoResponse } from "../Mapper/commands-meter-info.mapper";
import { buildCommandsMeterInfoPath } from "../Data/commands-meter.data";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsMeterInfoApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsMeterInfoResponse;
  responseTime: number;
}

export class CommandsMeterInfoApi {
  constructor(private request: APIRequestContext) {}

  async getMeterInfo(serial: string): Promise<CommandsMeterInfoApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      buildCommandsMeterInfoPath(serial),
    );
    const responseBody =
      await parseCommandsResponseBody<CommandsMeterInfoResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
