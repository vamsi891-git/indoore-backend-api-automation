import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;

type RequestOptions = Parameters<typeof getWithAutoRefresh>[2];

export interface DtrRequestResult {
    response: APIResponse;
    responseTime: number;
}

async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDtrWithRetry(
    request: APIRequestContext,
    url: string,
    options: RequestOptions = {},
): Promise<DtrRequestResult> {
    let lastResponse: APIResponse | undefined;
    let lastAttemptTime = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const attemptStart = Date.now();
        lastResponse = await getWithAutoRefresh(request, url, {
            timeout: 60_000,
            ...options,
        });
        lastAttemptTime = Date.now() - attemptStart;

        if (!RETRY_STATUSES.has(lastResponse.status()) || attempt === MAX_ATTEMPTS) {
            return { response: lastResponse, responseTime: lastAttemptTime };
        }

        await sleep(RETRY_DELAY_MS);
    }

    return {
        response: lastResponse!,
        responseTime: lastAttemptTime,
    };
}
