export type PowerQualityScenario =
  | "pq_by_ivrs"
  | "pq_by_account"
  | "pq_by_meter"
  | "pq_ignore_unknown_query"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "contract_null_data"
  | "contract_sp_metrics"
  | "contract_tp_metrics";

export interface PowerQualityErrorResponse {
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

export interface PowerQualityMetric {
  title: string;
  value: number | null;
  unit: string;
  subtitle: string | null;
}

export interface PowerQualityData {
  overallPf: PowerQualityMetric;
  frequency: PowerQualityMetric;
  neutralCurrent: PowerQualityMetric;
  mdKw: PowerQualityMetric;
  mdKva: PowerQualityMetric;
}

export interface PowerQualityResponse {
  success: boolean;
  data?: PowerQualityData | null;
}

export interface MappedPowerQuality {
  success: boolean;
  data: PowerQualityData | null;
  overallPf: PowerQualityMetric | null;
  frequency: PowerQualityMetric | null;
  neutralCurrent: PowerQualityMetric | null;
  mdKw: PowerQualityMetric | null;
  mdKva: PowerQualityMetric | null;
}

export class PowerQualityMapper {
  static map(response: PowerQualityResponse): MappedPowerQuality {
    const data = response.data ?? null;
    return {
      success: response.success,
      data,
      overallPf: data?.overallPf ?? null,
      frequency: data?.frequency ?? null,
      neutralCurrent: data?.neutralCurrent ?? null,
      mdKw: data?.mdKw ?? null,
      mdKva: data?.mdKva ?? null,
    };
  }
}
