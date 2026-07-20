import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { SubmissionDetailResponse } from "../Mapper/submission-detail.mapper";
import {
  encodePathSegment,
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

export interface SubmissionDetailApiResult {
  rawResponse: APIResponse;
  responseBody: SubmissionDetailResponse;
  responseTime: number;
}

export class SubmissionDetailApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getSubmissionDetail(
    submissionId: number | string,
  ): Promise<SubmissionDetailApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        `/indore/meter-replacement/submissions/${encodePathSegment(String(submissionId))}`,
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<SubmissionDetailResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
