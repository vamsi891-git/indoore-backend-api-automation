import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface AuditLogExportApiResponse {
    rawResponse: APIResponse;
    csvContent: string;
    responseTime: number;
}

const EXPORT_PATH = "/indore/users/audit-logs/export";
/** One long wait before a single 429 retry — avoids hammering the export quota */
const RATE_LIMIT_BACKOFF_MS = [0, 180_000];

export class AuditLogExportApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async exportAuditLogs(
        limit: number,
        sort: string,
    ): Promise<AuditLogExportApiResponse> {
        let rawResponse: APIResponse | undefined;
        let csvContent = "";
        let responseTime = 0;

        for (let attempt = 0; attempt < RATE_LIMIT_BACKOFF_MS.length; attempt++) {
            const waitMs = RATE_LIMIT_BACKOFF_MS[attempt];
            if (waitMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, waitMs));
            }

            const requestStart = Date.now();
            rawResponse = await getWithAutoRefresh(
                this.authenticatedApi,
                EXPORT_PATH,
                { params: { limit, sort } },
            );

            csvContent = await rawResponse.text();
            responseTime = Date.now() - requestStart;

            if (rawResponse.status() !== 429) {
                break;
            }
        }

        if (!rawResponse) {
            throw new Error("Audit log export did not return a response");
        }

        if (rawResponse.status() === 429) {
            throw new Error(
                `Audit log export rate-limited (429) after ${RATE_LIMIT_BACKOFF_MS.length} attempts. ` +
                    `Wait a few minutes before re-running export tests. Body: ${csvContent.slice(0, 200)}`,
            );
        }

        return {
            rawResponse,
            csvContent,
            responseTime,
        };
    }
}
