import { APIRequestContext, APIResponse } from "@playwright/test";
import { TARIFF_PATH, TariffRequestBody } from "../Data/commands-tariff.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsTariffApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsTariffApi {
  constructor(private request: APIRequestContext) {}

  async postTariff(body: TariffRequestBody): Promise<CommandsTariffApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      TARIFF_PATH,
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
