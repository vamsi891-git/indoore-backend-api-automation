import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { CommunicationConsumersResponse } from "../Mapper/communicationconsumers.mapper";

export type CommunicationConsumersApiResult =
  ApiCallResult<CommunicationConsumersResponse>;

export type CommunicationPeriodType = "day" | "month" | "range" | string;

export interface CommunicationConsumersQuery {
  periodType?: CommunicationPeriodType;
  date?: string;
  month?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  meterType?: string;
  mappingType?: string;
  includeTotal?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export class CommunicationConsumersApi extends TimedApiClient {
  getCommunicationConsumers(
    query: CommunicationConsumersQuery = {},
  ): Promise<CommunicationConsumersApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<CommunicationConsumersResponse>(
      "/indore/reports/communication/consumers",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
