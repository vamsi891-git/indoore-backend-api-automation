import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import {
    ValidateMeterErrorResponse,
    ValidateMeterResponse,
} from "../Mapper/validatemeter.mapper";

export type ValidateMeterApiResult = ApiCallResult<ValidateMeterResponse>;
export type ValidateMeterErrorApiResult =
    ApiCallResult<ValidateMeterErrorResponse>;

export class ValidateMeterApi extends TimedApiClient {
    static readonly PATH = "/indore/consumers/validate-meter";

    validateMeter(
        meterSerialNumber: string,
        organisationLookupId?: number,
    ): Promise<ValidateMeterApiResult> {
        const params: Record<string, string | number> = {
            meterSerialNumber,
        };
        if (organisationLookupId != null) {
            params.organisationLookupId = organisationLookupId;
        }
        return this.getJson<ValidateMeterResponse>(
            ValidateMeterApi.PATH,
            { params },
        );
    }

    /** Negative / edge probes (missing or empty meterSerialNumber). */
    validateMeterRaw(
        params: Record<string, string | number> = {},
    ): Promise<ValidateMeterErrorApiResult> {
        return this.getJson<ValidateMeterErrorResponse>(ValidateMeterApi.PATH, {
            params,
        });
    }
}
