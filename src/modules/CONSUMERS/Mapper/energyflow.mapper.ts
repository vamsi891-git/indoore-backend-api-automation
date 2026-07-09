export type EnergyFlowPeriod =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface EnergyFlowPoint {
  label: string;
  kwhImport: number;
  kvahImport: number;
  kwhExport: number;
  kvahExport: number;
}

export interface EnergyFlowData {
  period: EnergyFlowPeriod;
  points: EnergyFlowPoint[];
}

export interface EnergyFlowResponse {
  success: boolean;
  data?: EnergyFlowData | null;
}

export interface EnergyFlowErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export type EnergyFlowScenario =
  | "ef_by_ivrs_daily"
  | "ef_period_hourly"
  | "ef_period_weekly"
  | "ef_period_monthly"
  | "ef_period_yearly"
  | "ef_by_account"
  | "ef_by_meter"
  | "ef_ignore_unknown_query"
  | "contract_hourly"
  | "contract_daily"
  | "contract_weekly"
  | "contract_monthly"
  | "contract_yearly"
  | "contract_cumulative_nonzero"
  | "contract_consumption_formula"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "invalid_period";

export interface MappedEnergyFlow {
  success: boolean;
  period: EnergyFlowPeriod | "";
  points: EnergyFlowPoint[];
}

const EMPTY_FLOW_DATA: EnergyFlowData = {
  period: "daily",
  points: [],
};

export class EnergyFlowMapper {
  static map(response: EnergyFlowResponse): MappedEnergyFlow {
    const data = response.data ?? EMPTY_FLOW_DATA;
    return {
      success: response.success,
      period: data.period ?? "",
      points: data.points ?? [],
    };
  }
}
