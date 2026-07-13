import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import {
    ActivationErrorResponse,
    ConsumerActivationResponse,
    ConsumerActivationStatus,
} from "../Mapper/activation.mapper";

export type ActivationApiResult = ApiCallResult<ConsumerActivationResponse>;
export type ActivationErrorApiResult = ApiCallResult<ActivationErrorResponse>;

export interface ActivationRequestBody {
    status: ConsumerActivationStatus;
}

export class ActivationApi extends TimedApiClient {
    static pathFor(consumerId: string): string {
        return `/indore/consumers/${consumerId}/activation`;
    }

    updateActivation(
        consumerId: string,
        payload: ActivationRequestBody,
    ): Promise<ActivationApiResult> {
        return this.patchJson<ConsumerActivationResponse>(
            ActivationApi.pathFor(consumerId),
            { data: payload },
        );
    }

    /** Negative / edge probes (e.g. missing status body). */
    patchActivationRaw(
        consumerId: string,
        data: unknown,
    ): Promise<ActivationErrorApiResult> {
        return this.patchJson<ActivationErrorResponse>(
            ActivationApi.pathFor(consumerId),
            { data },
        );
    }
}