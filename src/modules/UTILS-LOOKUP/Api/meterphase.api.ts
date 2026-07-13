import { APIRequestContext, APIResponse } from "@playwright/test";
import { MeterPhaseResponse } from "../Mapper/meterphase.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface MeterPhaseApiResponse {
  rawResponse: APIResponse;
  responseBody: MeterPhaseResponse;
  responseTime: number;
}

export class MeterPhaseApi {
  static readonly PATH = "/indore/utils/meter-phases";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getMeterPhases(): Promise<MeterPhaseApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<MeterPhaseResponse>(
        this.authenticatedApi,
        MeterPhaseApi.PATH,
        "meter-phases",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
