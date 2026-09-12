export const minMaxVoltageCountDataKeys = ["total", "totalIsExact"] as const;

export interface MinMaxVoltageCountDataModel {
  total: number;
  totalIsExact?: boolean | null;
}

export interface MinMaxVoltageCountErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface MinMaxVoltageCountResponse {
  success: boolean;
  data?: MinMaxVoltageCountDataModel | null;
  message?: string;
  error?: MinMaxVoltageCountErrorBody["error"];
}

export interface MappedMinMaxVoltageCount {
  success: boolean;
  total: number;
  totalIsExact: boolean | null;
}

export type MinMaxVoltageCountScenario =
  | "dev_live_primary"
  | "dev_live_min_y"
  | "dev_live_min_b"
  | "dev_live_max_r"
  | "dev_live_max_y"
  | "dev_live_max_b"
  | "dev_ignore_unknown_query"
  | "dev_ignore_page_limit"
  | "dev_empty_window"
  | "contract_live_full"
  | "contract_empty"
  | "invalid_voltage_type"
  | "invalid_phase"
  | "invalid_month"
  | "invalid_year"
  | "missing_year"
  | "missing_month"
  | "missing_meter_phase";

export class MinMaxVoltageCountMapper {
  static map(response: MinMaxVoltageCountResponse): MappedMinMaxVoltageCount {
    const data = response.data ?? ({} as MinMaxVoltageCountDataModel);
    return {
      success: response.success,
      total: Number(data.total ?? 0),
      totalIsExact:
        data.totalIsExact === undefined ? null : Boolean(data.totalIsExact),
    };
  }
}
