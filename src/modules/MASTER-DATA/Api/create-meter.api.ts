import type { APIRequestContext } from "@playwright/test";
import { ApiCallResult } from "../../../core/models/api-result.model";
import type { CreateMeterRequestBody } from "../Data/create-meter.data";
import { CreateMeterResponse } from "../Mapper/create-meter.mapper";
import { postMasterDataJsonWithRetry } from "../utils/master-data-request.helper";

export type CreateMeterApiResult = ApiCallResult<CreateMeterResponse>;

export class CreateMeterApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  createMeter(payload: CreateMeterRequestBody): Promise<CreateMeterApiResult> {
    return postMasterDataJsonWithRetry<CreateMeterResponse>(
      this.authenticatedApi,
      "/indore/master-data/add-meter",
      { data: payload },
    );
  }
}
