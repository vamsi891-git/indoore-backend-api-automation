import type { APIRequestContext } from "@playwright/test";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DeactivateMeterResponse } from "../Mapper/deactivate-meter.mapper";
import { deleteMasterDataJsonWithRetry } from "../utils/master-data-request.helper";

export type DeactivateMeterApiResult = ApiCallResult<DeactivateMeterResponse>;

export class DeactivateMeterApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  deactivateMeter(
    meterLookupTblRefId: number,
  ): Promise<DeactivateMeterApiResult> {
    return deleteMasterDataJsonWithRetry<DeactivateMeterResponse>(
      this.authenticatedApi,
      `/indore/master-data/meters/${meterLookupTblRefId}`,
    );
  }
}
