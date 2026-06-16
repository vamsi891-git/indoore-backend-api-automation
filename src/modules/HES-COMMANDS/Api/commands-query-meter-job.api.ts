import { APIRequestContext, APIResponse } from "@playwright/test";
import { buildQueryMeterJobPath } from "../Data/commands-query-meter-job.data";
import { QueryMeterJobResponse } from "../Mapper/commands-query-meter-job.mapper";

export interface CommandsQueryMeterJobApiResult {
  rawResponse: APIResponse;
  responseBody: QueryMeterJobResponse;
  responseTime: number;
}

export class CommandsQueryMeterJobApi {
  constructor(private request: APIRequestContext) {}

  async getQueryMeterJob(jobName: string): Promise<CommandsQueryMeterJobApiResult> {
    const start = Date.now();
    const rawResponse = await this.request.get(buildQueryMeterJobPath(jobName));
    const responseBody = (await rawResponse.json()) as QueryMeterJobResponse;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
