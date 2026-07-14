import { APIRequestContext, APIResponse } from "@playwright/test";
import { postWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { CreateSubmissionRequestBody } from "../Data/create-submission.data";
import { CreateSubmissionResponse } from "../Mapper/create-submission.mapper";
import {
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

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

    const response = await withRateLimitRetry(() =>
      postWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/submissions",
        { data: payload },
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<CreateSubmissionResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
