import { APIRequestContext } from "@playwright/test";
import { hesMeterJobData } from "../Data/meterjob.data";

export interface OnDemandProfileSyncPayload {
  formattedProfileObisCode: string;
  sampleStartTime: string;
  sampleStopTime: string;
}

export interface OnDemandProfileApiResult {
  rawResponse: Awaited<ReturnType<APIRequestContext["post"]>>;
  responseBody: unknown;
  responseTime: number;
}

export class OnDemandProfileApi {
  constructor(private readonly hesApi: APIRequestContext) {}

  async readProfile(
    meterId: string,
    payload: OnDemandProfileSyncPayload
  ): Promise<OnDemandProfileApiResult> {
    const start = Date.now();
    const response = await this.hesApi.post(
      `${hesMeterJobData.paths.onDemandProfile()}/${encodeURIComponent(meterId)}`,
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
