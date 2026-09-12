import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { CreateConsumerResponse } from "../Mapper/create-consumer.mapper";
import { CreateConsumerRequestBody } from "../Data/create-consumer.data";

function assertWritesAllowed(action: string): void {
  if (process.env.ALLOW_WRITE_TESTS?.trim().toLowerCase() === "true") {
    return;
  }
  throw new Error(
    `Blocked ${action}. Create tests are off. Do not set ALLOW_WRITE_TESTS=true on production.`,
  );
}

export type CreateConsumerApiResult = ApiCallResult<CreateConsumerResponse>;

export class CreateConsumerApi extends TimedApiClient {
  createConsumer(
    payload: CreateConsumerRequestBody,
  ): Promise<CreateConsumerApiResult> {
    assertWritesAllowed("POST /indore/consumers");
    return this.postJson<CreateConsumerResponse>("/indore/consumers", {
      data: payload,
    });
  }
}
