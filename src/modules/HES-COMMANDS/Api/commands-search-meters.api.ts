import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  SEARCH_METERS_PATH,
  SearchMetersRequestBody,
} from "../Data/commands-search-meters.data";
import { SearchMetersResponse } from "../Mapper/commands-search-meters.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";

export interface CommandsSearchMetersApiResult {
  rawResponse: APIResponse;
  responseBody: SearchMetersResponse;
  responseTime: number;
}

export class CommandsSearchMetersApi {
  constructor(private request: APIRequestContext) {}

  async postSearchMeters(
    body: SearchMetersRequestBody,
  ): Promise<CommandsSearchMetersApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      SEARCH_METERS_PATH,
      body,
    );
    const responseBody = (await rawResponse.json()) as SearchMetersResponse;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
