import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommercialSummaryResponse } from "../Mapper/commercial-summary.mapper";
import { getCommercialSummaryWithRetry } from "../utils/commercial-request.helper";

export interface CommercialSummaryApiResult {
  rawResponse: APIResponse;
  responseBody: CommercialSummaryResponse;
  responseTime: number;
  attempts: number;
}

export class CommercialSummaryApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getCommercialSummary(
    month: number,
    year: number,
    pfThreshold: number,
  ): Promise<CommercialSummaryApiResult> {
    const { response, responseTime, attempts } =
      await getCommercialSummaryWithRetry(
        this.authenticatedApi,
        "/indore/analysis/commercial/summary",
        {
          params: {
            month,
            year,
            pfThreshold,
          },
        },
      );
    const responseBody = (await response
      .json()
      .catch(() => ({}))) as CommercialSummaryResponse;
    return {
      rawResponse: response,
      responseBody,
      responseTime,
      attempts,
    };
  }
}
