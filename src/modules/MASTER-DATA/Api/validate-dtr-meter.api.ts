import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  ValidateDtrMeterQuery,
  ValidateDtrMeterResponse,
} from "../Mapper/validate-dtr-meter.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface ValidateDtrMeterApiResult {
  rawResponse: APIResponse;
  responseBody: ValidateDtrMeterResponse;
  responseTime: number;
}

export class ValidateDtrMeterApi {
  constructor(private readonly request: APIRequestContext) {}

  async validateDtrMeter(
    query: ValidateDtrMeterQuery,
  ): Promise<ValidateDtrMeterApiResult> {
    const params = {
      meterSerialNumber: query.meterSerialNumber,
    };

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<ValidateDtrMeterResponse>(
        this.request,
        "/indore/master-data/validate-dtr-meter",
        params,
      );

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
