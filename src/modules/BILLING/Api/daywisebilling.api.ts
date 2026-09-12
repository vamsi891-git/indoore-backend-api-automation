import { APIRequestContext, APIResponse } from "@playwright/test";
import { getBillingWithRetry } from "../utils/billing-request.helper";
import { DaywiseBillingResponse } from "../Mapper/daywisebilling.mapper";
import type { DaywiseBillingQueryParams } from "../Data/daywisebilling.data";

export interface DaywiseBillingApiResponse {
  rawResponse: APIResponse;
  responseBody: DaywiseBillingResponse;
  responseTime: number;
}

export class DaywiseBillingApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getDaywiseBillingData(
    query: DaywiseBillingQueryParams = {},
  ): Promise<DaywiseBillingApiResponse> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    const suffix = params.toString();
    const path = `/indore/billing/daywise-billing-data${suffix ? `?${suffix}` : ""}`;
    const { response: rawResponse, responseTime } = await getBillingWithRetry(
      this.authenticatedApi,
      path,
    );
    const responseBody = await rawResponse.json();
    return { rawResponse, responseBody, responseTime };
  }
}
