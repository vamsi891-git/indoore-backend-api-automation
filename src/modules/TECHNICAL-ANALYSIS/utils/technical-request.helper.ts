import { APIRequestContext, APIResponse } from "@playwright/test";
import { TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const TECHNICAL_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const TECHNICAL_MAX_ATTEMPTS = 5;
const TECHNICAL_RETRY_DELAY_MS = 5_000;

export interface TechnicalRequestResult {
  response: APIResponse;
  responseTime: number;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Technical report queries are heavy and often return transient 500s under load. */
export async function getTechnicalReportWithRetry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<typeof getWithAutoRefresh>[2],
): Promise<TechnicalRequestResult> {
  let lastResponse: APIResponse | undefined;
  let lastAttemptTime = 0;

  for (let attempt = 1; attempt <= TECHNICAL_MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now();
    const response = await getWithAutoRefresh(request, url, {
      timeout: TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS,
      ...options,
    });
    lastAttemptTime = Date.now() - attemptStart;
    lastResponse = response;

    if (
      !TECHNICAL_RETRY_STATUSES.has(response.status()) ||
      attempt === TECHNICAL_MAX_ATTEMPTS
    ) {
      return { response, responseTime: lastAttemptTime };
    }

    console.warn(
      `[Technical Analysis] HTTP ${response.status()} on attempt ${attempt}/${TECHNICAL_MAX_ATTEMPTS}, retrying in ${TECHNICAL_RETRY_DELAY_MS}ms`,
    );
    await sleep(TECHNICAL_RETRY_DELAY_MS);
  }

  return { response: lastResponse!, responseTime: lastAttemptTime };
}
