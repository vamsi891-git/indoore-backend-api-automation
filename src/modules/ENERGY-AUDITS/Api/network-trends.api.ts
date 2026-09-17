import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  NetworkTrendQuery,
  NetworkTrendResponse,
} from "../Mapper/network-trends.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { printApiResponse } from "../../../core/utils/response-console.util";

export interface NetworkTrendsApiResult {
  rawResponse: APIResponse;
  responseBody: NetworkTrendResponse;
  responseTime: number;
}

export class NetworkTrendsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getNetworkTrends(
    query: NetworkTrendQuery,
  ): Promise<NetworkTrendsApiResult> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/energy-audit/network-trends",
      { params: query as unknown as Record<string, string | number> },
    );
    const responseTime = Date.now() - start;
    const bodyText = await rawResponse.text();
    const responseBody = (
      bodyText ? JSON.parse(bodyText) : { success: false }
    ) as NetworkTrendResponse;

    if (!rawResponse.ok()) {
      printApiResponse({
        apiName: "Energy Audit Network Trends",
        status: rawResponse.status(),
        body: bodyText,
        requestParams: query,
      });
    }

    return { rawResponse, responseBody, responseTime };
  }
}
