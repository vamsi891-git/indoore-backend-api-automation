import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { CommunicationStatusResponse } from "../Mapper/communicationstatus.mapper";

export type CommunicationStatusApiResult =
  ApiCallResult<CommunicationStatusResponse>;

export interface CommunicationStatusQuery {
  date?: string;
  [key: string]: string | number | boolean | undefined;
}

export class CommunicationStatusApi extends TimedApiClient {
  getCommunicationStatus(
    consumerRef: string,
    query: CommunicationStatusQuery = {},
  ): Promise<CommunicationStatusApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<CommunicationStatusResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/communication-status`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
