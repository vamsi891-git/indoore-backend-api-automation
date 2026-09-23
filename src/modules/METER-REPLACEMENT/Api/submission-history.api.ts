import { APIRequestContext, APIResponse } from "@playwright/test";
import { SubmissionHistoryResponse } from "../Mapper/submission-history.mapper";
import { safeResponseJson, withRateLimitRetry } from "../utils/response.helper";

export interface SubmissionHistoryApiResult {
  rawResponse: APIResponse;
  responseBody: SubmissionHistoryResponse;
  responseTime: number;
}

export class SubmissionHistoryApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getSubmissionHistory(
    page: number,
    limit: number,
    search?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<SubmissionHistoryApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      this.authenticatedApi.get("/indore/meter-replacement/submissions/history", {
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
        },
      }),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<SubmissionHistoryResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
