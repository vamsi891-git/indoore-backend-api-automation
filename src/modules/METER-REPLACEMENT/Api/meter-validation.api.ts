import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { MeterValidationResponse } from "../Mapper/meter-validation.mapper";
import {
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

export interface MeterValidationApiResult {
  rawResponse: APIResponse;
  responseBody: MeterValidationResponse;
  responseTime: number;
}

export class MeterValidationApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async validateMeter(meterSerial: string): Promise<MeterValidationApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/meters/validate",
        {
          params: {
            meterSerial,
          },
        },
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<MeterValidationResponse>(response),
      responseTime: Date.now() - start,
    };
  }

  async validateMeterWithoutSerial(): Promise<MeterValidationApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/meters/validate",
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<MeterValidationResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
