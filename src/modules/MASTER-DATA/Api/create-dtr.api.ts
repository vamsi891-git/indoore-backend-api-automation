import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import type { CreateDtrRequestBody } from "../Data/create-dtr.data";
import { CreateDtrResponse } from "../Mapper/create-dtr.mapper";

export type CreateDtrApiResult = ApiCallResult<CreateDtrResponse>;

export class CreateDtrApi extends TimedApiClient {
  createDtr(payload: CreateDtrRequestBody): Promise<CreateDtrApiResult> {
    return this.postJson<CreateDtrResponse>("/indore/master-data/add-dtr", {
      data: payload,
    });
  }
}
