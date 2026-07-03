import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  ValidateAddMeterQuery,
  ValidateAddMeterResponse,
} from "../Mapper/validate-add-meter.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface ValidateAddMeterApiResult {
  rawResponse: APIResponse;
  responseBody: ValidateAddMeterResponse;
  responseTime: number;
}

export class ValidateAddMeterApi {
  constructor(private readonly request: APIRequestContext) {}

  async validateAddMeter(
    query: ValidateAddMeterQuery,
  ): Promise<ValidateAddMeterApiResult> {
    const params = {
      meterSerialNumber: query.meterSerialNumber,
    };

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<ValidateAddMeterResponse>(
        this.request,
        "/indore/master-data/validate-add-meter",
        params,
      );

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
