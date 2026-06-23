import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  LOAD_CURTAILMENT_PATH,
  LoadCurtailmentRequestBody,
} from "../Data/commands-load-curtailment.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsLoadCurtailmentApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsLoadCurtailmentApi {
  constructor(private request: APIRequestContext) {}

  async postLoadCurtailment(
    body: LoadCurtailmentRequestBody,
  ): Promise<CommandsLoadCurtailmentApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      LOAD_CURTAILMENT_PATH,
      body,
    );
    const responseBody =
      await parseCommandsResponseBody<CommandJobInitResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
