import type { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { UTILS_LOOKUP_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { sleep } from "./lookup-api-parse.helper";

const LOOKUP_RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const LOOKUP_MAX_ATTEMPTS = 4;
const LOOKUP_RETRY_BASE_DELAY_MS = 3_000;
/** Spacing between lookup calls when running the full UTILS-LOOKUP module. */
const LOOKUP_REQUEST_GAP_MS = 400;

let lastLookupRequestAt = 0;

export interface LookupJsonResult<T> {
  rawResponse: APIResponse;
  responseBody: T;
  responseTime: number;
}

function isTransientLookupBody(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<html") || trimmed.includes("too many request");
}

function shouldRetryLookup(
  status: number,
  text: string,
  attempt: number,
): boolean {
  if (attempt >= LOOKUP_MAX_ATTEMPTS) {
    return false;
  }
  if (LOOKUP_RETRY_STATUSES.has(status)) {
    return true;
  }
  return isTransientLookupBody(text);
}

function parseLookupBody<T>(text: string, label: string, status: number): T {
  if (!text.trim()) {
    return { success: false } as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    if (status === 429 || isTransientLookupBody(text)) {
      return { success: false } as T;
    }
    throw new Error(
      `${label} returned non-JSON (${status}): ${text.slice(0, 120)}`,
    );
  }
}

async function throttleLookupRequest(): Promise<void> {
  const now = Date.now();
  const waitMs = lastLookupRequestAt + LOOKUP_REQUEST_GAP_MS - now;
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastLookupRequestAt = Date.now();
}

/** GET lookup endpoint with auth refresh, 429 backoff, and safe JSON parsing. */
export async function fetchLookupJson<T>(
  request: APIRequestContext,
  path: string,
  label: string,
): Promise<LookupJsonResult<T>> {
  await throttleLookupRequest();
  const start = Date.now();
  let lastResponse: APIResponse | undefined;
  let lastText = "";

  for (let attempt = 1; attempt <= LOOKUP_MAX_ATTEMPTS; attempt++) {
    lastResponse = await getWithAutoRefresh(request, path, {
      timeout: UTILS_LOOKUP_REQUEST_TIMEOUT_MS,
    });
    lastText = await lastResponse.text();

    if (shouldRetryLookup(lastResponse.status(), lastText, attempt)) {
      await sleep(LOOKUP_RETRY_BASE_DELAY_MS * attempt);
      continue;
    }
    break;
  }

  const rawResponse = lastResponse!;
  const responseBody = parseLookupBody<T>(
    lastText,
    label,
    rawResponse.status(),
  );

  return {
    rawResponse,
    responseBody,
    responseTime: Date.now() - start,
  };
}
