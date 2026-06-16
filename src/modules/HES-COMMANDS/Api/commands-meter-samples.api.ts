import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  MeterSamplesRequestBody,
  METER_SAMPLES_PATH,
} from "../Data/commands-meter-samples.data";
import { MeterSamplesResponse } from "../Mapper/commands-meter-samples.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";

export interface CommandsMeterSamplesApiResult {
  rawResponse: APIResponse;
  responseBody: MeterSamplesResponse;
  responseTime: number;
}

export class CommandsMeterSamplesApi {
  constructor(private request: APIRequestContext) {}

  async postMeterSamples(
    body: MeterSamplesRequestBody,
  ): Promise<CommandsMeterSamplesApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      METER_SAMPLES_PATH,
      body,
    );
    const responseBody = (await rawResponse.json()) as MeterSamplesResponse;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
