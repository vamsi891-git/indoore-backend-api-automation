import { APIRequestContext, APIResponse } from "@playwright/test";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  getWithAutoRefresh,
  postWithAutoRefresh,
} from "../../../core/utils/authenticated.request";

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 3_000;

function isTransientNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(message);
}

function retryDelayMs(status: number, attempt: number): number {
  if (status === 429) {
    return BASE_RETRY_DELAY_MS * attempt * 2;
  }
  return BASE_RETRY_DELAY_MS;
}

export interface CommandsRequestResult {
  rawResponse: APIResponse;
  responseTime: number;
}

async function requestCommandsWithRetry(
  dispatch: () => Promise<APIResponse>,
): Promise<CommandsRequestResult> {
  let lastError: unknown;
  let lastResponseTime = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      const rawResponse = await dispatch();
      lastResponseTime = Date.now() - start;
      const status = rawResponse.status();

      if (!RETRY_STATUSES.has(status) || attempt === MAX_ATTEMPTS) {
        return { rawResponse, responseTime: lastResponseTime };
      }

      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs(status, attempt)),
      );
    } catch (error) {
      lastError = error;
      lastResponseTime = Date.now() - start;
      if (!isTransientNetworkError(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs(500, attempt)),
      );
    }
  }

  throw lastError;
}

export async function postCommandsWithRetry(
  request: APIRequestContext,
  url: string,
  data: unknown,
): Promise<CommandsRequestResult> {
  return requestCommandsWithRetry(() =>
    postWithAutoRefresh(request, url, {
      data,
      timeout: DEFAULT_REQUEST_TIMEOUT_MS,
    }),
  );
}

export async function getCommandsWithRetry(
  request: APIRequestContext,
  url: string,
): Promise<CommandsRequestResult> {
  return requestCommandsWithRetry(() =>
    getWithAutoRefresh(request, url, {
      timeout: DEFAULT_REQUEST_TIMEOUT_MS,
    }),
  );
}
