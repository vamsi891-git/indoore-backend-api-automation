import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { CreateConsumerResponse } from "../Mapper/createconsumer.mapper";
import { CreateConsumerRequestBody } from "../Data/createconsumer.data";

export type CreateConsumerApiResult = ApiCallResult<CreateConsumerResponse>;

export class CreateConsumerApi extends TimedApiClient {
    createConsumer(
        payload: CreateConsumerRequestBody,
    ): Promise<CreateConsumerApiResult> {
        return this.postJson<CreateConsumerResponse>("/indore/consumers", {
            data: payload,
        });
    }
}
