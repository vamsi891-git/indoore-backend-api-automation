import { APIRequestContext, APIResponse} from "@playwright/test";
import { getWithAutoRefresh} from "../../../core/utils/authenticated.request";
import { AuditLogsResponse} from "../Mapper/auditlogs.mapper";
export interface AuditLogsApiResponse {
    rawResponse: APIResponse;
    responseBody: AuditLogsResponse;
    responseTime: number;
}
export class AuditLogsApi {
    constructor(private authenticatedApi: APIRequestContext) { }
    async getAuditLogs( page: number, limit: number, sort: string): Promise<AuditLogsApiResponse> {
        const start = Date.now();
        const rawResponse =
            await getWithAutoRefresh(this.authenticatedApi,`/indore/users/audit-logs?page=${page}&limit=${limit}&sort=${sort}`);
        const responseBody =await rawResponse.json();
        const responseTime =Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}