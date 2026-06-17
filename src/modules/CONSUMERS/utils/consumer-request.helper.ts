import { APIRequestContext, APIResponse } from "@playwright/test";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 8_000;

function isTransientNetworkError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(message);
}

export interface ConsumerGetResult {
    rawResponse: APIResponse;
    responseTime: number;
}

export async function getConsumerWithRetry(
    request: APIRequestContext,
    url: string,
): Promise<ConsumerGetResult> {
    const startedAt = Date.now();
    let lastError: unknown;
    let lastResponse: APIResponse | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            lastResponse = await getWithAutoRefresh(request, url, {
                timeout: DEFAULT_REQUEST_TIMEOUT_MS,
            });

            if (!RETRY_STATUSES.has(lastResponse.status()) || attempt === MAX_ATTEMPTS) {
                return {
                    rawResponse: lastResponse,
                    responseTime: Date.now() - startedAt,
                };
            }
        } catch (error) {
            lastError = error;
            if (!isTransientNetworkError(error) || attempt === MAX_ATTEMPTS) {
                throw error;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    if (lastResponse) {
        return {
            rawResponse: lastResponse,
            responseTime: Date.now() - startedAt,
        };
    }

    throw lastError;
}
