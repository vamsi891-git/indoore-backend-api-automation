import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  METERING_MODE_PATH,
  MeteringModeRequestBody,
} from "../Data/commands-metering-mode.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";

export interface CommandsMeteringModeApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsMeteringModeApi {
  constructor(private request: APIRequestContext) {}

  async postMeteringMode(
    body: MeteringModeRequestBody,
  ): Promise<CommandsMeteringModeApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      METERING_MODE_PATH,
      body,
    );
    const responseBody = (await rawResponse.json()) as CommandJobInitResponse;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
