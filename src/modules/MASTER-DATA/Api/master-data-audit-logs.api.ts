import { APIRequestContext, APIResponse } from "@playwright/test";
import type {
  MasterDataAuditLogsQuery,
  MasterDataAuditLogsResponse,
} from "../Mapper/master-data-audit-logs.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface MasterDataAuditLogsApiResult {
  rawResponse: APIResponse;
  responseBody: MasterDataAuditLogsResponse;
  responseTime: number;
}

export class MasterDataAuditLogsApi {
  constructor(private readonly request: APIRequestContext) {}

  async getAuditLogs(
    query: MasterDataAuditLogsQuery = {},
  ): Promise<MasterDataAuditLogsApiResult> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.sort?.trim()) {
      params.sort = query.sort.trim();
    }
    if (query.action?.trim()) {
      params.action = query.action.trim();
    }
    if (query.actionPrefix?.trim()) {
      params.actionPrefix = query.actionPrefix.trim();
    }

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<MasterDataAuditLogsResponse>(
        this.request,
        "/indore/master-data/audit-logs",
        params,
      );

    return { rawResponse, responseBody, responseTime };
  }
}
