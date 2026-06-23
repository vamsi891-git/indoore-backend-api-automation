import type { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";

const MASTER_DATA_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const MASTER_DATA_MAX_ATTEMPTS = 4;
const MASTER_DATA_RETRY_DELAY_MS = 4_000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MasterDataRequestResult {
  response: APIResponse;
  responseTime: number;
}

/** Retries transient 5xx (incl. 504) on heavy master-data list endpoints. */
export async function getMasterDataWithRetry(
  request: APIRequestContext,
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<MasterDataRequestResult> {
  let lastResponse: APIResponse | undefined;
  let lastAttemptTime = 0;

  for (let attempt = 1; attempt <= MASTER_DATA_MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now();
    const response = await getWithAutoRefresh(request, path, {
      params,
      timeout: masterDataMaxResponseTimeMs,
    });
    lastAttemptTime = Date.now() - attemptStart;
    lastResponse = response;

    if (
      !MASTER_DATA_RETRY_STATUSES.has(response.status()) ||
      attempt === MASTER_DATA_MAX_ATTEMPTS
    ) {
      return { response, responseTime: lastAttemptTime };
    }

    await sleep(MASTER_DATA_RETRY_DELAY_MS);
  }

  return { response: lastResponse!, responseTime: lastAttemptTime };
}
