import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConnectionStatusResponse } from "../Mapper/connectionstatus.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface ConnectionStatusApiResponse {
  rawResponse: APIResponse;
  responseBody: ConnectionStatusResponse;
  responseTime: number;
}

export class ConnectionStatusApi {
  static readonly PATH = "/indore/utils/connection-statuses";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getConnectionStatuses(): Promise<ConnectionStatusApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<ConnectionStatusResponse>(
        this.authenticatedApi,
        ConnectionStatusApi.PATH,
        "connection-statuses",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
