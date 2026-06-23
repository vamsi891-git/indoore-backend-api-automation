import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommandsHistoryResponse } from "../Mapper/commands-history.mapper";
import {
  buildCommandsHistoryPath,
  CommandsHistoryQuery,
} from "../Data/commands-history.data";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsHistoryApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsHistoryResponse;
  responseTime: number;
}

export class CommandsHistoryApi {
  constructor(private request: APIRequestContext) {}

  async getHistory(
    query: CommandsHistoryQuery = {},
  ): Promise<CommandsHistoryApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      buildCommandsHistoryPath(query),
    );
    const responseBody =
      await parseCommandsResponseBody<CommandsHistoryResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
