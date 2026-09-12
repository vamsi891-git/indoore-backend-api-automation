import { APIRequestContext, APIResponse } from "@playwright/test";
import { getBillingWithRetry } from "../utils/billing-request.helper";
import { BillingDataResponse } from "../Mapper/billingdata.mapper";
import type { BillingDataQuery } from "../Data/billingdata.data";

export interface BillingApiResponse {
  rawResponse: APIResponse;
  responseBody: BillingDataResponse;
  responseTime: number;
}

export class BillingDataApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getBillingData(query: BillingDataQuery = {}): Promise<BillingApiResponse> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    const suffix = params.toString();
    const path = `/indore/billing/billing-data${suffix ? `?${suffix}` : ""}`;
    const { response: rawResponse, responseTime } = await getBillingWithRetry(
      this.authenticatedApi,
      path,
    );
    const responseBody = await rawResponse.json();
    return { rawResponse, responseBody, responseTime };
  }
}
