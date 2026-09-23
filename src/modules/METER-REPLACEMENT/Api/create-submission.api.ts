import { APIRequestContext, APIResponse } from "@playwright/test";
import type { CreateSubmissionRequestBody } from "../Data/create-submission.data";
import { CreateSubmissionResponse } from "../Mapper/create-submission.mapper";
import { safeResponseJson, withRateLimitRetry } from "../utils/response.helper";

export interface CreateSubmissionApiResult {
  rawResponse: APIResponse;
  responseBody: CreateSubmissionResponse;
  responseTime: number;
}

export class CreateSubmissionApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async createSubmission(
    payload: CreateSubmissionRequestBody | Record<string, unknown>,
  ): Promise<CreateSubmissionApiResult> {
    const start = Date.now();

    // authenticatedApi.post already auto-refreshes; do not wrap postWithAutoRefresh again.
    const response = await withRateLimitRetry(() =>
      this.authenticatedApi.post("/indore/meter-replacement/submissions", {
        data: payload,
      }),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<CreateSubmissionResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
