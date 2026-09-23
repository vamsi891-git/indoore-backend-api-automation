import { APIRequestContext, APIResponse } from "@playwright/test";
import { PING_PATH, PingRequestBody } from "../Data/commands-ping.data";
import { PingResponse } from "../Mapper/commands-ping.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsPingApiResult {
  rawResponse: APIResponse;
  responseBody: PingResponse;
  responseTime: number;
}

export class CommandsPingApi {
  constructor(private request: APIRequestContext) {}

  async postPing(body: PingRequestBody): Promise<CommandsPingApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      PING_PATH,
      body,
    );
    const responseBody = await parseCommandsResponseBody<PingResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
