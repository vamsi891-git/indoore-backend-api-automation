import { APIRequestContext, APIResponse } from "@playwright/test";
import { buildQueryMeterJobPath } from "../Data/commands-query-meter-job.data";
import { QueryMeterJobResponse } from "../Mapper/commands-query-meter-job.mapper";
import { getCommandsWithRetry } from "../utils/commands-request.helper";
import { parseCommandsResponseBody } from "../utils/commands-response.helper";

export interface CommandsQueryMeterJobApiResult {
  rawResponse: APIResponse;
  responseBody: QueryMeterJobResponse;
  responseTime: number;
}

export class CommandsQueryMeterJobApi {
  constructor(private request: APIRequestContext) {}

  async getQueryMeterJob(jobName: string): Promise<CommandsQueryMeterJobApiResult> {
    const { rawResponse, responseTime } = await getCommandsWithRetry(
      this.request,
      buildQueryMeterJobPath(jobName),
    );
    const responseBody =
      await parseCommandsResponseBody<QueryMeterJobResponse>(rawResponse);
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
