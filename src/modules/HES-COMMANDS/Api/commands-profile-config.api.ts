import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  PROFILE_CONFIG_PATH,
  ProfileConfigRequestBody,
} from "../Data/commands-profile-config.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsProfileConfigApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsProfileConfigApi {
  constructor(private request: APIRequestContext) {}

  async postProfileConfig(
    body: ProfileConfigRequestBody,
  ): Promise<CommandsProfileConfigApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      PROFILE_CONFIG_PATH,
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
