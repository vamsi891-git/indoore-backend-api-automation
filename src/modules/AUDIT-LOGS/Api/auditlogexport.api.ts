import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { AuditLogExportTestData } from "../Data/auditlogexport.data";

export interface AuditLogExportApiResponse {
    rawResponse: APIResponse;
    csvContent: string;
    responseTime: number;
}
const MAX_429_ATTEMPTS = 2;
export class AuditLogExportApi {
    private static lastExportRequestAt = 0;
    constructor(private readonly authenticatedApi: APIRequestContext) {}
    private static async waitForExportSlot(): Promise<void> {
        if (AuditLogExportApi.lastExportRequestAt === 0) {
            return;
        }

        const elapsed = Date.now() - AuditLogExportApi.lastExportRequestAt;
        const remaining =
            AuditLogExportTestData.minExportIntervalMs - elapsed;

        if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
        }
    }

    async exportAuditLogs(
        limit: number,
        sort: string,
    ): Promise<AuditLogExportApiResponse> {
        let rawResponse: APIResponse | undefined;
        let csvContent = "";
        let responseTime = 0;

        for (let attempt = 0; attempt < MAX_429_ATTEMPTS; attempt++) {
            await AuditLogExportApi.waitForExportSlot();

            const requestStart = Date.now();
            rawResponse = await getWithAutoRefresh(
                this.authenticatedApi,
                AuditLogExportTestData.exportPath,
                { params: { limit, sort } },
            );

            csvContent = await rawResponse.text();
            responseTime = Date.now() - requestStart;

            const status = rawResponse.status();
            if (status === 200 || status === 429) {
                AuditLogExportApi.lastExportRequestAt = Date.now();
            }

            if (status !== 429) {
                break;
            }
        }

        if (!rawResponse) {
            throw new Error("Audit log export did not return a response");
        }

        if (rawResponse.status() === 429) {
            throw new Error(
                `Audit log export rate-limited (429) after ${MAX_429_ATTEMPTS} attempts ` +
                    `(min ${AuditLogExportTestData.minExportIntervalMs / 1000}s between export calls). ` +
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
