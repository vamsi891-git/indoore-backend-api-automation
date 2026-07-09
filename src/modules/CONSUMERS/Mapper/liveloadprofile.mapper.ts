export type LiveLoadProfileScenario =
  | "llp_by_ivrs"
  | "llp_by_account"
  | "llp_by_meter"
  | "llp_ignore_unknown_query"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "contract_null_data"
  | "contract_tp_metrics"
  | "contract_sp_metrics";

export interface LiveLoadProfileErrorResponse {
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

export interface LiveLoadProfileMetric {
  title: string;
  value: number | null;
  percent: number | null;
}

export interface LiveLoadProfileData {
  lastReadingIso: string | null;
  meterPhase: "SP" | "TP";
  total: number | null;
  metrics: LiveLoadProfileMetric[];
}

export interface LiveLoadProfileResponse {
  success: boolean;
  data?: LiveLoadProfileData | null;
}

export interface MappedLiveLoadProfile {
  success: boolean;
  data: LiveLoadProfileData | null;
  lastReadingIso: string | null;
  meterPhase: "SP" | "TP" | null;
  total: number | null;
  activePower: LiveLoadProfileMetric | null;
  apparentPower: LiveLoadProfileMetric | null;
  reactivePower: LiveLoadProfileMetric | null;
}

const METRIC_TITLES = [
  "Active Power",
  "Apparent Power",
  "Reactive Power",
] as const;

function findMetric(
  metrics: LiveLoadProfileMetric[] | undefined,
  title: (typeof METRIC_TITLES)[number],
): LiveLoadProfileMetric | null {
  if (!metrics) return null;
  return metrics.find((m) => m.title === title) ?? null;
}

export class LiveLoadProfileMapper {
  static map(response: LiveLoadProfileResponse): MappedLiveLoadProfile {
    const data = response.data ?? null;
    const metrics = data?.metrics ?? [];
    return {
      success: response.success,
      data,
      lastReadingIso: data?.lastReadingIso ?? null,
      meterPhase: data?.meterPhase ?? null,
      total: data?.total ?? null,
      activePower: findMetric(metrics, "Active Power"),
      apparentPower: findMetric(metrics, "Apparent Power"),
      reactivePower: findMetric(metrics, "Reactive Power"),
    };
  }
}
