import { APIRequestContext, APIResponse } from "@playwright/test";
import { NetworkTrendQuery,NetworkTrendResponse} from "../Mapper/network-trends.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
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
    if (!rawResponse.ok()) {
      throw new Error(
        `Network Trends API failed — status ${rawResponse.status()}: ${await rawResponse.text()}`,
      );
    }
    return {
      rawResponse,
      responseBody: (await rawResponse.json()) as NetworkTrendResponse,
      responseTime,
    };
  }
}
