export type RealTimePowerScenario =
  | "power_by_ivrs"
  | "power_by_account"
  | "power_by_meter"
  | "power_ignore_unknown_query"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "contract_null_data"
  | "contract_tp_phases"
  | "contract_sp_phases";

export interface RealTimePowerErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface PhaseReading {
  voltage: number | null;
  voltageUnit: string;
  current: number | null;
  currentUnit: string;
  powerFactor: number | null;
  powerFactorUnit: string;
}

export interface RealTimePowerData {
  "R-Phase": PhaseReading | null;
  "Y-Phase": PhaseReading | null;
  "B-Phase": PhaseReading | null;
}

export interface RealTimePowerResponse {
  success: boolean;
  data?: RealTimePowerData | null;
}

export interface MappedRealTimePower {
  success: boolean;
  data: RealTimePowerData | null;
  rPhase: PhaseReading | null;
  yPhase: PhaseReading | null;
  bPhase: PhaseReading | null;
}

export class RealTimePowerMapper {
  static map(response: RealTimePowerResponse): MappedRealTimePower {
    const data = response.data ?? null;
    return {
      success: response.success,
      data,
      rPhase: data?.["R-Phase"] ?? null,
      yPhase: data?.["Y-Phase"] ?? null,
      bPhase: data?.["B-Phase"] ?? null,
    };
  }
}
