export type EnergyConsumptionPeriod =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface GraphPoint {
  label: string;
  consumptionKwh: number;
}

export interface EnergyConsumptionGraphData {
  period: EnergyConsumptionPeriod;
  points: GraphPoint[];
}

export interface EnergyConsumptionGraphResponse {
  success: boolean;
  data?: EnergyConsumptionGraphData | null;
}

export interface EnergyConsumptionGraphErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export type EnergyConsumptionGraphScenario =
  | "ecg_by_ivrs_daily"
  | "ecg_period_hourly"
  | "ecg_period_weekly"
  | "ecg_period_monthly"
  | "ecg_period_yearly"
  | "ecg_by_account"
  | "ecg_by_meter"
  | "ecg_ignore_unknown_query"
  | "contract_hourly"
  | "contract_daily"
  | "contract_weekly"
  | "contract_monthly"
  | "contract_yearly"
  | "contract_nonzero_consumption"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "invalid_period";

export interface MappedEnergyConsumptionGraph {
  success: boolean;
  period: EnergyConsumptionPeriod | "";
  points: GraphPoint[];
}

const EMPTY_GRAPH_DATA: EnergyConsumptionGraphData = {
  period: "daily",
  points: [],
};

export class EnergyConsumptionGraphMapper {
  static map(
    response: EnergyConsumptionGraphResponse,
  ): MappedEnergyConsumptionGraph {
    const data = response.data ?? EMPTY_GRAPH_DATA;
    return {
      success: response.success,
      period: data.period ?? "",
      points: data.points ?? [],
    };
  }
}
