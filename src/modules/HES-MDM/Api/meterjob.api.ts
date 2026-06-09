import { APIRequestContext, APIResponse } from "@playwright/test";
import { hesMeterJobData } from "../Data/meterjob.data";
import { MeterJobRequest } from "../shared/meter-job.types";

export interface MeterJobApiResult {
  rawResponse: APIResponse;
  responseBody: unknown;
  responseTime: number;
}

export class MeterJobApi {
  constructor(private readonly hesApi: APIRequestContext) {}

  async createJob(
    payload: MeterJobRequest | Record<string, unknown>
  ): Promise<MeterJobApiResult> {
    const start = Date.now();
    const response = await this.hesApi.post(hesMeterJobData.paths.meterJob(), {
      data: payload
    });

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
