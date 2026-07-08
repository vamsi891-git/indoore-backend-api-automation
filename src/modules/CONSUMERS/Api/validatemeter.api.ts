import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { ValidateMeterResponse } from "../Mapper/validatemeter.mapper";

export type ValidateMeterApiResult = ApiCallResult<ValidateMeterResponse>;

export class ValidateMeterApi extends TimedApiClient {
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
            "/indore/consumers/validate-meter",
            { params },
        );
    }
}
