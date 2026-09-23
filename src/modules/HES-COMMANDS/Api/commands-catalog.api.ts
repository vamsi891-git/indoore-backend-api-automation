import { APIRequestContext, APIResponse } from "@playwright/test";
import { COMMANDS_CATALOG_PATH } from "../Data/commands-catalog.data";
import { CommandsCatalogResponse } from "../Mapper/commands-catalog.mapper";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsCatalogApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsCatalogResponse;
  responseTime: number;
}

export class CommandsCatalogApi {
  constructor(private request: APIRequestContext) {}

  async getCatalog(): Promise<CommandsCatalogApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      COMMANDS_CATALOG_PATH,
    );
    const responseBody = await parseCommandsResponseBody<CommandsCatalogResponse>(rawResponse);
    return { rawResponse, responseBody, responseTime };
  }
}
