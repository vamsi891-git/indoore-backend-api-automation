import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import {
  EnergyFlowResponse,
  type EnergyFlowPeriod,
} from "../Mapper/energyflow.mapper";

export type EnergyFlowApiResult = ApiCallResult<EnergyFlowResponse>;

export interface EnergyFlowQuery {
  period?: EnergyFlowPeriod | string;
  [key: string]: string | number | boolean | undefined;
}

export class EnergyFlowApi extends TimedApiClient {
  getEnergyFlow(
    consumerRef: string,
    query: EnergyFlowQuery = { period: "daily" },
  ): Promise<EnergyFlowApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<EnergyFlowResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/energy-flow`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
