export type DtrCapacityGaugeScenario =
  | "dcg_by_code_primary"
  | "dcg_by_code_alt"
  | "dcg_ignore_unknown_query"
  | "contract_all_null_bands"
  | "contract_populated_bands"
  | "contract_gauge_percent_formula"
  | "contract_primary_fallback_zeros"
  | "dtr_not_found"
  | "empty_dtr_code";

export interface CapacityBand {
  label: string;
  value: number | null;
  percent: number | null;
  unit: string;
}

export interface CapacityGaugeData {
  ratedCapacityKva: number | null;
  bands: CapacityBand[];
}

export interface DtrCapacityGaugeResponse {
  success: boolean;
  data?: CapacityGaugeData | null;
}

export interface DtrCapacityGaugeErrorResponse {
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

export interface MappedDtrCapacityGauge {
  success: boolean;
  ratedCapacityKva: number | null;
  bands: CapacityBand[];
}

export class DtrCapacityGaugeMapper {
  static map(response: DtrCapacityGaugeResponse): MappedDtrCapacityGauge {
    const data = response.data;
    return {
      success: response.success,
      ratedCapacityKva: data?.ratedCapacityKva ?? null,
      bands: (data?.bands ?? []).map((band) => ({
        label: band.label,
        value: band.value ?? null,
        percent: band.percent ?? null,
        unit: band.unit,
      })),
    };
  }
}
