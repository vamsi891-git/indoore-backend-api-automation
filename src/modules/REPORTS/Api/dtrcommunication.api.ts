import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrCommunicationReportResponse } from "../Mapper/dtrcommunication.mapper";

export type DtrCommunicationReportApiResult =
  ApiCallResult<DtrCommunicationReportResponse>;

export interface DtrCommunicationReportQuery {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  includeArchiveCounts?: boolean;
  organisationLookupId?: number;
  networkLookupId?: number;
  meterSerialNumber?: string;
  [key: string]: string | number | boolean | undefined;
}

export class DtrCommunicationReportApi extends TimedApiClient {
  getDtrCommunication(
    query: DtrCommunicationReportQuery = {},
  ): Promise<DtrCommunicationReportApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrCommunicationReportResponse>(
      "/indore/reports/dtr-communication",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
