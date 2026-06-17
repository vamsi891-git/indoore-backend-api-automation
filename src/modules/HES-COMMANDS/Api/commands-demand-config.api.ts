import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  DEMAND_CONFIG_PATH,
  DemandConfigRequestBody,
} from "../Data/commands-demand-config.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";

export interface CommandsDemandConfigApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsDemandConfigApi {
  constructor(private request: APIRequestContext) {}

  async postDemandConfig(
    body: DemandConfigRequestBody,
  ): Promise<CommandsDemandConfigApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      DEMAND_CONFIG_PATH,
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
