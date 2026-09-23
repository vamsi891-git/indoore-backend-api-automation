import { APIRequestContext, APIResponse } from "@playwright/test";
import { ON_DEMAND_PATH, OnDemandRequestBody } from "../Data/commands-on-demand.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsOnDemandApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsOnDemandApi {
  constructor(private request: APIRequestContext) {}

  async postOnDemand(body: OnDemandRequestBody): Promise<CommandsOnDemandApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      ON_DEMAND_PATH,
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
