import type { APIRequestContext, APIResponse } from "@playwright/test";
import {
  getWithAutoRefresh,
  postWithAutoRefresh,
} from "../../../core/utils/authenticated.request";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";

const MASTER_DATA_RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MASTER_DATA_MAX_ATTEMPTS = 4;
const MASTER_DATA_RETRY_DELAY_MS = 4_000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientMasterDataBody(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<html") || trimmed.includes("too many request");
}

function shouldRetryMasterDataAttempt(
  status: number,
  bodyText: string,
  attempt: number,
): boolean {
  if (attempt >= MASTER_DATA_MAX_ATTEMPTS) {
    return false;
  }
  if (MASTER_DATA_RETRY_STATUSES.has(status)) {
    return true;
  }
  return isTransientMasterDataBody(bodyText);
}

function parseMasterDataJson<T>(
  method: string,
  path: string,
  response: APIResponse,
  text: string,
): T {
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

export interface MasterDataRequestResult {
  response: APIResponse;
  responseTime: number;
}

export interface MasterDataJsonResult<T> {
  rawResponse: APIResponse;
  responseBody: T;
  responseTime: number;
}

/** Retries transient 429/5xx and HTML/rate-limit bodies on heavy master-data list endpoints. */
export async function getMasterDataWithRetry(
  request: APIRequestContext,
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<MasterDataRequestResult> {
  const { rawResponse, responseTime } = await fetchMasterDataJson<unknown>(
    request,
    path,
    params,
  );
  return { response: rawResponse, responseTime };
}

/** GET master-data endpoint with auth refresh, retries, and safe JSON parsing. */
export async function fetchMasterDataJson<T>(
  request: APIRequestContext,
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<MasterDataJsonResult<T>> {
  const start = Date.now();
  let lastResponse: APIResponse | undefined;
  let lastText = "";

  for (let attempt = 1; attempt <= MASTER_DATA_MAX_ATTEMPTS; attempt++) {
    lastResponse = await getWithAutoRefresh(request, path, {
      params,
      timeout: masterDataMaxResponseTimeMs,
    });
    lastText = await lastResponse.text();

    if (shouldRetryMasterDataAttempt(lastResponse.status(), lastText, attempt)) {
      await sleep(MASTER_DATA_RETRY_DELAY_MS * attempt);
      continue;
    }

    break;
  }

  const rawResponse = lastResponse!;
  const responseBody = parseMasterDataJson<T>(
    "GET",
    path,
    rawResponse,
    lastText,
  );

  return {
    rawResponse,
    responseBody,
    responseTime: Date.now() - start,
  };
}

/** POST master-data endpoint with auth refresh, retries on 429/5xx, and safe JSON parsing. */
export async function postMasterDataJsonWithRetry<T>(
  request: APIRequestContext,
  path: string,
  options?: Parameters<typeof postWithAutoRefresh>[2],
): Promise<MasterDataJsonResult<T>> {
  const start = Date.now();
  let lastResponse: APIResponse | undefined;
  let lastText = "";

  for (let attempt = 1; attempt <= MASTER_DATA_MAX_ATTEMPTS; attempt++) {
    lastResponse = await postWithAutoRefresh(request, path, {
      timeout: masterDataMaxResponseTimeMs,
      ...options,
    });
    lastText = await lastResponse.text();

    if (shouldRetryMasterDataAttempt(lastResponse.status(), lastText, attempt)) {
      await sleep(MASTER_DATA_RETRY_DELAY_MS * attempt);
      continue;
    }

    break;
  }

  const rawResponse = lastResponse!;
  const responseBody = parseMasterDataJson<T>(
    "POST",
    path,
    rawResponse,
    lastText,
  );

  return {
    rawResponse,
    responseBody,
    responseTime: Date.now() - start,
  };
}
