import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { ConsumerActivationResponse } from "../Mapper/activation.mapper";

export type ActivationApiResult = ApiCallResult<ConsumerActivationResponse>;

export interface ActivationRequestBody {
    status: string;
}

export class ActivationApi extends TimedApiClient {
    updateActivation(
        consumerId: string,
        payload: ActivationRequestBody,
    ): Promise<ActivationApiResult> {
        return this.patchJson<ConsumerActivationResponse>(
            `/indore/consumers/${consumerId}/activation`,
            { data: payload },
        );
    }
}
