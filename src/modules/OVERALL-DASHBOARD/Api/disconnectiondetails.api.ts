import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DisconnectionDetailsResponse } from "../Mapper/disconnectiondetails.mapper";
import { DISCONNECTION_DETAILS_PATH } from "../Data/disconnectiondetails.data";

export type DisconnectionDetailsApiResult =
  ApiCallResult<DisconnectionDetailsResponse>;

export class DisconnectionDetailsApi extends TimedApiClient {
  getDisconnectionDetails(
    extras: Record<string, string | number | boolean> = {},
  ): Promise<DisconnectionDetailsApiResult> {
    return this.getJson<DisconnectionDetailsResponse>(
      DISCONNECTION_DETAILS_PATH,
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        params: extras,
      },
    );
  }
}
