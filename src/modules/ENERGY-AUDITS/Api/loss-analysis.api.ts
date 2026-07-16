import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  LossAnalysisQuery,
  LossAnalysisResponse,
} from "../Mapper/loss-analysis.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { printApiResponse } from "../../../core/utils/response-console.util";

export interface LossAnalysisApiResult {
  rawResponse: APIResponse;
  responseBody: LossAnalysisResponse;
  responseTime: number;
}

const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class LossAnalysisApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getLossAnalysis(
    query: LossAnalysisQuery,
  ): Promise<LossAnalysisApiResult> {
    let lastResponse: APIResponse | undefined;
    let lastBodyText = "";
    let responseTime = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const start = Date.now();
      lastResponse = await getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/energy-audit/loss-analysis",
        { params: query as unknown as Record<string, string | number> },
      );
      responseTime = Date.now() - start;
      lastBodyText = await lastResponse.text();

      if (!RETRY_STATUSES.has(lastResponse.status()) || attempt === MAX_ATTEMPTS) {
        break;
      }
      await sleep(RETRY_DELAY_MS);
    }

    const rawResponse = lastResponse!;
    if (!rawResponse.ok()) {
      printApiResponse({
        apiName: "Energy Audit Loss Analysis",
        status: rawResponse.status(),
        body: lastBodyText,
        requestParams: query,
      });
      throw new Error(
        `Loss Analysis API failed — status ${rawResponse.status()}: ${lastBodyText}`,
      );
    }

    const responseBody = (
      lastBodyText
        ? JSON.parse(lastBodyText)
        : { success: false }
    ) as LossAnalysisResponse;

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
