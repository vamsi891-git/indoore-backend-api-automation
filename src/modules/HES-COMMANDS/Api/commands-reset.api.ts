import { APIRequestContext, APIResponse } from "@playwright/test";
import { RESET_PATH, ResetRequestBody } from "../Data/commands-reset.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsResetApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsResetApi {
  constructor(private request: APIRequestContext) {}

  async postReset(body: ResetRequestBody): Promise<CommandsResetApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      RESET_PATH,
      body,
    );
    const responseBody = await parseCommandsResponseBody<CommandJobInitResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
