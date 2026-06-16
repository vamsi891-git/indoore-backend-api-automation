import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommandsHistoryResponse } from "../Mapper/commands-history.mapper";
import {
  buildCommandsHistoryPath,
  CommandsHistoryQuery,
} from "../Data/commands-history.data";

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
    const start = Date.now();
    const rawResponse = await this.request.get(buildCommandsHistoryPath(query));
    const responseBody =
      (await rawResponse.json()) as CommandsHistoryResponse;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
