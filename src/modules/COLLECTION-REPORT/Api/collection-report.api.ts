import { APIRequestContext, APIResponse } from "@playwright/test";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { CollectionReportResponse } from "../Mapper/collection-report.mapper";
import type { CollectionReportType } from "../Data/collection-report.data";

export type CollectionReportApiResult = ApiCallResult<CollectionReportResponse>;

export interface CollectionReportQuery {
  reportType?: CollectionReportType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  imbalanceThreshold?: number;
  currentMismatchThreshold?: number;
  lowConsumptionThreshold?: number;
  organisationLookupId?: number;
  networkLookupId?: number;
  categoryTblRefId?: number;
  meterSerialContains?: string;
  ivrsContains?: string;
  phaseId?: number;
  afterMeterLookupId?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Collection-report archive aggregates often return 503 QUERY_TIMEOUT.
 * Do not HTTP-retry those — retries only multiply archive load.
 */
export class CollectionReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getCollectionReport(query: CollectionReportQuery): Promise<CollectionReportApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    const start = Date.now();
    const rawResponse: APIResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/collection-report",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        params,
      },
    );
    const responseTime = Date.now() - start;

    let responseBody: CollectionReportResponse;
    try {
      responseBody = (await rawResponse.json()) as CollectionReportResponse;
    } catch {
      responseBody = { success: false };
    }

    return { rawResponse, responseBody, responseTime };
  }
}
