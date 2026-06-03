import {
    APIRequestContext,
    APIResponse
} from "@playwright/test";

import { getWithAutoRefresh }
    from "../../../core/utils/authenticated.request";

import {
    FeederElectricalParametersResponse
} from "../Mapper/feeder-electrical-parameters.mapper";

export interface FeederElectricalParametersApiResult {

    rawResponse: APIResponse;

    responseBody: FeederElectricalParametersResponse;

    responseTime: number;
}

export class FeederElectricalParametersApi {

    constructor(
        private readonly authenticatedApi: APIRequestContext
    ) { }

    async getElectricalParameters(
        feederCode: string
    ): Promise<FeederElectricalParametersApiResult> {

        const start = Date.now();

        const response =
            await getWithAutoRefresh(
                this.authenticatedApi,
                `/indore/feeder/${feederCode}/electrical-parameters`
            );

        return {
            rawResponse: response,

            responseBody:
                await response.json(),

            responseTime:
                Date.now() - start
        };
    }
}