import type { APIRequestContext, APIResponse } from "@playwright/test";
import {
  postWithAutoRefresh,
} from "../../../core/utils/authenticated.request";

export const METER_REPLACEMENT_MAX_RESPONSE_TIME_MS = 15_000;

const METER_REPLACEMENT_RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const METER_REPLACEMENT_MAX_ATTEMPTS = 4;
const METER_REPLACEMENT_RETRY_DELAY_MS = 4_000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientBody(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<html") || trimmed.includes("too many request");
}

function shouldRetryAttempt(status: number, bodyText: string, attempt: number): boolean {
  if (attempt >= METER_REPLACEMENT_MAX_ATTEMPTS) {
    return false;
  }
  if (METER_REPLACEMENT_RETRY_STATUSES.has(status)) {
    return true;
  }
  return isTransientBody(bodyText);
}

function parseJson<T>(method: string, path: string, response: APIResponse, text: string): T {
  if (!text.trim()) {
    return null as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `${method} ${path} returned non-JSON (${response.status()}): ${text.slice(0, 200)}`,
    );
  }
}

export interface MeterReplacementJsonResult<T> {
  rawResponse: APIResponse;
  responseBody: T;
  responseTime: number;
}

/** POST meter-replacement endpoint with auth refresh, retries on 429/5xx, and safe JSON parsing. */
export async function postMeterReplacementJsonWithRetry<T>(
  request: APIRequestContext,
  path: string,
  options?: Parameters<typeof postWithAutoRefresh>[2],
): Promise<MeterReplacementJsonResult<T>> {
  const start = Date.now();
  let lastResponse: APIResponse | undefined;
  let lastText = "";

  for (let attempt = 1; attempt <= METER_REPLACEMENT_MAX_ATTEMPTS; attempt++) {
    lastResponse = await postWithAutoRefresh(request, path, {
      timeout: METER_REPLACEMENT_MAX_RESPONSE_TIME_MS,
      ...options,
    });
    lastText = await lastResponse.text();

    if (shouldRetryAttempt(lastResponse.status(), lastText, attempt)) {
      await sleep(METER_REPLACEMENT_RETRY_DELAY_MS * attempt);
      continue;
    }

    break;
  }

  const rawResponse = lastResponse!;
  const responseBody = parseJson<T>("POST", path, rawResponse, lastText);

  return {
    rawResponse,
    responseBody,
    responseTime: Date.now() - start,
  };
}