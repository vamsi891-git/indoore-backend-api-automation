import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { FeederProfileResponse } from "../Mapper/feederprofile.mapper";

export interface FeederProfileApiResult {
  rawResponse: APIResponse;
  responseBody: FeederProfileResponse;
  responseTime: number;
}

export class FeederProfileApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getFeederProfile(
    feederCode: string,
    extras: Record<string, string | number | boolean> = {},
  ): Promise<FeederProfileApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      `/indore/feeder/${encodeURIComponent(feederCode)}/profile`,
      Object.keys(extras).length > 0 ? { params: extras } : {},
    );
    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime: Date.now() - start,
    };
  }
}
