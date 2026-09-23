import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  CALENDAR_WINDOW_PATH,
  buildCommandsCalendarPath,
  CommandsCalendarQuery,
} from "../Data/commands-calendar.data";
import {
  CommandsCalendarResponse,
  CommandsCalendarWindowResponse,
} from "../Mapper/commands-calendar.mapper";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsCalendarApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsCalendarResponse;
  responseTime: number;
}

export interface CommandsCalendarWindowApiResult {
  rawResponse: APIResponse;
  responseBody: CommandsCalendarWindowResponse;
  responseTime: number;
}

export class CommandsCalendarApi {
  constructor(private request: APIRequestContext) {}

  async getCalendar(query: CommandsCalendarQuery = {}): Promise<CommandsCalendarApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      buildCommandsCalendarPath(query),
    );
    const responseBody = await parseCommandsResponseBody<CommandsCalendarResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }

  async getCalendarWindow(): Promise<CommandsCalendarWindowApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      CALENDAR_WINDOW_PATH,
    );
    const responseBody =
      await parseCommandsResponseBody<CommandsCalendarWindowResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
