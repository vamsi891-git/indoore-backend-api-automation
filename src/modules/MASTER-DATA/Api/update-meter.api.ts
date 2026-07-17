import type { APIRequestContext } from "@playwright/test";
import { ApiCallResult } from "../../../core/models/api-result.model";
import type { UpdateMeterRequestBody } from "../Data/update-meter.data";
import { UpdateMeterResponse } from "../Mapper/update-meter.mapper";
import { putMasterDataJsonWithRetry } from "../utils/master-data-request.helper";

export type UpdateMeterApiResult = ApiCallResult<UpdateMeterResponse>;

export class UpdateMeterApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  updateMeter(
    meterLookupTblRefId: number,
    payload: UpdateMeterRequestBody,
  ): Promise<UpdateMeterApiResult> {
    return putMasterDataJsonWithRetry<UpdateMeterResponse>(
      this.authenticatedApi,
      `/indore/master-data/meters/${meterLookupTblRefId}`,
      { data: payload },
    );
  }
}
