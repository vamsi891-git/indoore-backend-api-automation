import { APIRequestContext, APIResponse } from "@playwright/test";
import { COMMANDS_HISTORY_FILTERS_PATH } from "../Data/commands-history-filters.data";
import { CommandsHistoryFiltersResponse } from "../Mapper/commands-history-filters.mapper";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsHistoryFiltersApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsHistoryFiltersResponse;
  responseTime: number;
}

export class CommandsHistoryFiltersApi {
  constructor(private request: APIRequestContext) {}

  async getFilters(): Promise<CommandsHistoryFiltersApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      COMMANDS_HISTORY_FILTERS_PATH,
    );
    const responseBody =
      await parseCommandsResponseBody<CommandsHistoryFiltersResponse>(rawResponse);
    return { rawResponse, responseBody, responseTime };
  }
}
