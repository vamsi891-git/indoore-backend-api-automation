import { APIRequestContext } from "@playwright/test";
import { hesMeterJobData } from "../Data/meterjob.data";

export interface MeterPingApiResult {
  rawResponse: Awaited<ReturnType<APIRequestContext["get"]>>;
  responseBody: unknown;
  responseTime: number;
}

export class MeterPingApi {
  constructor(private readonly hesApi: APIRequestContext) {}

  async ping(meterId: string): Promise<MeterPingApiResult> {
    const start = Date.now();
    const response = await this.hesApi.get(
      `${hesMeterJobData.paths.meterPing()}/${encodeURIComponent(meterId)}`
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
