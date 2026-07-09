import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import {
  EnergyConsumptionGraphResponse,
  type EnergyConsumptionPeriod,
} from "../Mapper/energyconsumptiongraph.mapper";

export type EnergyConsumptionGraphApiResult =
  ApiCallResult<EnergyConsumptionGraphResponse>;

export interface EnergyConsumptionGraphQuery {
  period?: EnergyConsumptionPeriod | string;
  [key: string]: string | number | boolean | undefined;
}

export class EnergyConsumptionGraphApi extends TimedApiClient {
  getEnergyConsumptionGraph(
    consumerRef: string,
    query: EnergyConsumptionGraphQuery = { period: "daily" },
  ): Promise<EnergyConsumptionGraphApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<EnergyConsumptionGraphResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/energy-consumption-graph`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
