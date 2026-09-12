import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import type { CreateDtrRequestBody } from "../Data/create-dtr.data";
import { CreateDtrResponse } from "../Mapper/create-dtr.mapper";

function assertWritesAllowed(action: string): void {
  if (process.env.ALLOW_WRITE_TESTS?.trim().toLowerCase() === "true") {
    return;
  }
  throw new Error(
    `Blocked ${action}. Create tests are off. Do not set ALLOW_WRITE_TESTS=true on production.`,
  );
}

export type CreateDtrApiResult = ApiCallResult<CreateDtrResponse>;

export class CreateDtrApi extends TimedApiClient {
  createDtr(payload: CreateDtrRequestBody): Promise<CreateDtrApiResult> {
    assertWritesAllowed("POST /indore/master-data/add-dtr");
    return this.postJson<CreateDtrResponse>("/indore/master-data/add-dtr", {
      data: payload,
    });
  }
}
