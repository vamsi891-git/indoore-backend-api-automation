import { APIRequestContext, APIResponse } from "@playwright/test";
import { hesMeterJobData } from "../Data/meterjob.data";

export interface QueryMeterJobApiResult {
  rawResponse: APIResponse;
  responseBody: unknown;
  responseTime: number;
}

export class QueryMeterJobApi {
  constructor(private readonly hesApi: APIRequestContext) {}

  async getJob(jobName: string): Promise<QueryMeterJobApiResult> {
    const start = Date.now();
    const response = await this.hesApi.get(
      `${hesMeterJobData.paths.queryMeterJob()}/${encodeURIComponent(jobName)}`
    );

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    return {
      rawResponse: response,
      responseBody,
      responseTime: Date.now() - start
    };
  }
}
