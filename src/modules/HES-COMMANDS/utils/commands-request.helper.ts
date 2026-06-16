import { APIRequestContext, APIResponse } from "@playwright/test";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { postWithAutoRefresh } from "../../../core/utils/authenticated.request";

const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3_000;

function isTransientNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(message);
}

export interface CommandsPostResult {
  rawResponse: APIResponse;
  responseTime: number;
}

export async function postCommandsWithRetry(
  request: APIRequestContext,
  url: string,
  data: unknown,
): Promise<CommandsPostResult> {
  let lastError: unknown;
  let lastResponseTime = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      const rawResponse = await postWithAutoRefresh(request, url, {
        data,
        timeout: DEFAULT_REQUEST_TIMEOUT_MS,
      });
      lastResponseTime = Date.now() - start;

      if (!RETRY_STATUSES.has(rawResponse.status()) || attempt === MAX_ATTEMPTS) {
        return { rawResponse, responseTime: lastResponseTime };
      }
    } catch (error) {
      lastError = error;
      lastResponseTime = Date.now() - start;
      if (!isTransientNetworkError(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  throw lastError;
}
