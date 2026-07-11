import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConnectionStatusResponse } from "../Mapper/connectionstatus.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface ConnectionStatusApiResponse {
  rawResponse: APIResponse;
  responseBody: ConnectionStatusResponse;
  responseTime: number;
}

export class ConnectionStatusApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getConnectionStatuses(): Promise<ConnectionStatusApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<ConnectionStatusResponse>(
        this.authenticatedApi,
        "/indore/utils/connection-statuses",
        "connection-statuses",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
