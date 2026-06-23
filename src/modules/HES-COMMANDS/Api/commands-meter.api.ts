import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommandsMeterLookupResponse } from "../Mapper/commands-meter.mapper";
import { buildCommandsMeterPath } from "../Data/commands-meter.data";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsMeterApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsMeterLookupResponse;
  responseTime: number;
}

export class CommandsMeterApi {
  constructor(private request: APIRequestContext) {}

  async getMeterBySerial(serial: string): Promise<CommandsMeterApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      buildCommandsMeterPath(serial),
    );
    const responseBody =
      await parseCommandsResponseBody<CommandsMeterLookupResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
