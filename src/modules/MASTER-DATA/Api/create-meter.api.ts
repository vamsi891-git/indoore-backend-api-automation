import type { APIRequestContext } from "@playwright/test";
import { ApiCallResult } from "../../../core/models/api-result.model";
import type { CreateMeterRequestBody } from "../Data/create-meter.data";
import { CreateMeterResponse } from "../Mapper/create-meter.mapper";
import { postMasterDataJsonWithRetry } from "../utils/master-data-request.helper";

function assertWritesAllowed(action: string): void {
  if (process.env.ALLOW_WRITE_TESTS?.trim().toLowerCase() === "true") {
    return;
  }
  throw new Error(
    `Blocked ${action}. Create tests are off. Do not set ALLOW_WRITE_TESTS=true on production.`,
  );
}

export type CreateMeterApiResult = ApiCallResult<CreateMeterResponse>;

export class CreateMeterApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  createMeter(payload: CreateMeterRequestBody): Promise<CreateMeterApiResult> {
    assertWritesAllowed("POST /indore/master-data/add-meter");
    return postMasterDataJsonWithRetry<CreateMeterResponse>(
      this.authenticatedApi,
      "/indore/master-data/add-meter",
      { data: payload },
    );
  }
}
