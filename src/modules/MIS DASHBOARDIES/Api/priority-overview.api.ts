import { APIRequestContext, APIResponse } from "@playwright/test";
import { PriorityOverviewResponse } from "../Mapper/priority-overview.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface PriorityOverviewApiResult {
  rawResponse: APIResponse;
  responseBody: PriorityOverviewResponse;
  responseTime: number;
}

export class PriorityOverviewApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getPriorityOverview(
    params: Record<string, string | number | boolean>
  ): Promise<PriorityOverviewApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/mis-dashboard/priority-overview",
      { params }
    );

    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime: Date.now() - start
    };
  }
}
