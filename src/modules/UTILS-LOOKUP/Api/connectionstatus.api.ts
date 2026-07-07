// Api/connectionstatus.api.ts
/**
 * =============================================================================
 * BACKEND ISSUES — GET /indore/utils/connection-statuses
 * Probe: reports/probe-hierarchy.txt (2026-07-07)
 * =============================================================================
 *
 * This lookup endpoint works (HTTP 200). Defect is on consumer CREATE/BULK APIs
 * that do not reject invalid Connection Status ids against this list.
 *
 * Proof (this endpoint — HTTP 200):
 * {
 *   "success": true,
 *   "data": {
 *     "items": [
 *       { "id": 1, "name": "Connected",               "shortName": "CD" },
 *       { "id": 2, "name": "Disconnected",            "shortName": "TD" },
 *       { "id": 3, "name": "Permanent Disconnection", "shortName": "PD" }
 *     ]
 *   }
 * }
 *
 * Automation uses id=1 ("Connected") via CREATE_CONSUMER_CONNECTION_STATUS_TBL_REF_ID
 * or live resolve in consumer-lookup.helper.ts.
 *
 * Related backend defect (POST /indore/consumers):
 *   Payload: "Connection Status": 99999
 *   Expected: HTTP 400 VALIDATION_ERROR
 *   Historical: HTTP 201 (Bulk upload validations.txt CREATE CONSUMER defects).
 *
 * Related bulk-upload-consumers defect (blocked until hierarchy mapping fixed):
 *   row_invalid_connection_status — cannot reach field validation while bulk path
 *   returns subStationNetworkLookupId / feederNetworkLookupId required first.
 */
import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConnectionStatusResponse } from "../Mapper/connectionstatus.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { parseLookupJsonResponse } from "../utils/lookup-api-parse.helper";
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
      responseBody: await parseLookupJsonResponse<ConnectionStatusResponse>(
        rawResponse,
        "connection-statuses",
      ),
      responseTime: Date.now() - start
    };
  }
}
