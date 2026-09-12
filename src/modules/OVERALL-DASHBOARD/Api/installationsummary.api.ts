import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { InstallationSummaryResponse } from "../Mapper/installationsummary.mapper";
import { INSTALLATION_SUMMARY_PATH } from "../Data/installationsummary.data";

export type InstallationSummaryApiResult =
  ApiCallResult<InstallationSummaryResponse>;

export class InstallationSummaryApi extends TimedApiClient {
  getInstallationSummary(
    extras: Record<string, string | number | boolean> = {},
  ): Promise<InstallationSummaryApiResult> {
    return this.getJson<InstallationSummaryResponse>(INSTALLATION_SUMMARY_PATH, {
      timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
      params: extras,
    });
  }
}
