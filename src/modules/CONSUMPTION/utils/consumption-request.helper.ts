import { APIRequestContext, APIResponse } from "@playwright/test";
import { CONSUMPTION_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 8_000;

type RequestOptions = Parameters<typeof getWithAutoRefresh>[2];

export interface ConsumptionRequestResult {
    response: APIResponse;
    /** Duration of the final HTTP attempt only (excludes retry delays). */
    responseTime: number;
}

function isTransientNetworkError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(message);
}

async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getConsumptionWithRetry(
    request: APIRequestContext,
    url: string,
    options: RequestOptions = {},
): Promise<ConsumptionRequestResult> {
    let lastResponse: APIResponse | undefined;
    let lastAttemptTime = 0;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const attemptStart = Date.now();
            lastResponse = await getWithAutoRefresh(request, url, {
                timeout: CONSUMPTION_REQUEST_TIMEOUT_MS,
                ...options,
            });
            lastAttemptTime = Date.now() - attemptStart;

            if (!RETRY_STATUSES.has(lastResponse.status()) || attempt === MAX_ATTEMPTS) {
                return {
                    response: lastResponse,
                    responseTime: lastAttemptTime,
                };
            }
        } catch (error) {
            lastError = error;
            if (!isTransientNetworkError(error) || attempt === MAX_ATTEMPTS) {
                throw error;
            }
        }

        await sleep(RETRY_DELAY_MS);
    }

    if (lastResponse) {
        return {
            response: lastResponse,
            responseTime: lastAttemptTime,
        };
    }

    throw lastError;
}
