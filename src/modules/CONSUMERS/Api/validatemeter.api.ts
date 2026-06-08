import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { ValidateMeterResponse } from "../Mapper/validatemeter.mapper";

export type ValidateMeterApiResult = ApiCallResult<ValidateMeterResponse>;

export class ValidateMeterApi extends TimedApiClient {
    validateMeter(
        meterSerialNumber: string,
        organisationLookupId: number,
    ): Promise<ValidateMeterApiResult> {
        return this.getJson<ValidateMeterResponse>(
            "/indore/consumers/validate-meter",
            {
                params: {
                    meterSerialNumber,
                    organisationLookupId,
                },
            },
        );
    }
}
