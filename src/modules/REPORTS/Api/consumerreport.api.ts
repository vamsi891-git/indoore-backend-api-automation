import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerReportResponse } from "../Mapper/consumerreport.mapper";

export type ConsumerReportApiResult = ApiCallResult<ConsumerReportResponse>;

export type ConsumerReportType = "ls" | "dp" | "ip" | string;

export interface ConsumerReportQuery {
  fromDate?: string;
  toDate?: string;
  meterSerialNumber?: string;
  /** Live query key is kebab-case. */
  "report-type"?: ConsumerReportType;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export class ConsumerReportApi extends TimedApiClient {
  getConsumerReport(
    query: ConsumerReportQuery = {},
  ): Promise<ConsumerReportApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<ConsumerReportResponse>(
      "/indore/reports/consumer-report",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
