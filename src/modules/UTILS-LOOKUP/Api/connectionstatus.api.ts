// Api/connectionstatus.api.ts

import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConnectionStatusResponse } from "../Mapper/connectionstatus.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface ConnectionStatusApiResponse {
  rawResponse: APIResponse
  responseBody: ConnectionStatusResponse;
  responseTime: number;
}
export class ConnectionStatusApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getConnectionStatuses(): Promise<ConnectionStatusApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/connection-statuses");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
