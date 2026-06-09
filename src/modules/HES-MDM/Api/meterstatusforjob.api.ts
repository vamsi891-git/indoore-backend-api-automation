import { APIRequestContext } from "@playwright/test";
import { hesMeterJobData } from "../Data/meterjob.data";

export interface MeterStatusForJobApiResult {
  rawResponse: Awaited<ReturnType<APIRequestContext["post"]>>;
  responseBody: unknown;
  responseTime: number;
}

export class MeterStatusForJobApi {
  constructor(private readonly hesApi: APIRequestContext) {}

  async getStatus(jobName: string, payload: Record<string, unknown> = {}): Promise<MeterStatusForJobApiResult> {
    const start = Date.now();
    const response = await this.hesApi.post(
      `${hesMeterJobData.paths.meterStatusForJob()}/${encodeURIComponent(jobName)}`,
      { data: payload }
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
