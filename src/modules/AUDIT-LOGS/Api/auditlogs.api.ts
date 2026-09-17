import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { auditLogsPath, auditLogsQueryString } from "../Data/auditlogs.data";
import { AuditLogsQuery, AuditLogsResponse } from "../Mapper/auditlogs.mapper";

export interface AuditLogsApiResponse {
  rawResponse: APIResponse;
  responseBody: AuditLogsResponse;
  responseTime: number;
}

export class AuditLogsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getAuditLogs(
    query: AuditLogsQuery = { page: 1, limit: 20, sort: "createdAt_desc" },
  ): Promise<AuditLogsApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      `${auditLogsPath}?${auditLogsQueryString(query)}`,
    );
    const responseBody = (await rawResponse.json()) as AuditLogsResponse;
    const responseTime = Date.now() - start;

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
