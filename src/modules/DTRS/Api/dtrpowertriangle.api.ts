import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DtrPowerTriangleResponse } from "../Mapper/dtrpowertriangle.mapper";
import { getDtrWithRetry } from "../utils/dtr-request.helper";

export type DtrPowerTriangleApiResult = ApiCallResult<DtrPowerTriangleResponse>;

export class DtrPowerTriangleApi extends TimedApiClient {
    async getPowerTriangle(dtrCode: string): Promise<DtrPowerTriangleApiResult> {
        const { response, responseTime } = await getDtrWithRetry(
            this.authenticatedApi,
            `/indore/dtr/${dtrCode}/power-triangle`,
        );

        let responseBody: DtrPowerTriangleResponse;
        try {
            responseBody = (await response.json()) as DtrPowerTriangleResponse;
        } catch {
            responseBody = { success: false };
        }

        return {
            rawResponse: response,
            responseBody,
            responseTime,
        };
    }
}
