import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
  AuditLogExportTestData,
  auditLogExportQuery,
} from "../Data/auditlogexport.data";

export interface AuditLogExportApiResponse {
  rawResponse: APIResponse;
  csvContent: string;
  responseTime: number;
}

export class AuditLogExportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async exportAuditLogs(
    limit: number,
    sort: string,
    page: number = AuditLogExportTestData.page,
  ): Promise<AuditLogExportApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      `${AuditLogExportTestData.exportPath}?${auditLogExportQuery({
        page,
        limit,
        sort,
      })}`,
      {
        headers: { Accept: "text/csv" },
        timeout: AuditLogExportTestData.requestTimeoutMs,
      },
    );
    const csvContent = await rawResponse.text();
    const responseTime = Date.now() - start;
    return { rawResponse, csvContent, responseTime };
  }
}
