import { APIRequestContext, APIResponse } from "@playwright/test";
import { MeterPhaseResponse } from "../Mapper/meterphase.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface MeterPhaseApiResponse {
  rawResponse: APIResponse;
  responseBody: MeterPhaseResponse;
  responseTime: number;
}

export class MeterPhaseApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getMeterPhases(): Promise<MeterPhaseApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<MeterPhaseResponse>(
        this.authenticatedApi,
        "/indore/utils/meter-phases",
        "meter-phases",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
