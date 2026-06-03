export interface TechnicalAnalysisConfig {
  analysisType: string;
  month: number;
  year: number;
  hasData: boolean;
  pageSize: number;
  maxResponseTime: number;
  validationType:
    | "duration100"
    | "duration12"
    | "duration10"
    | "count"
    | "phase";
}

export const TechnicalAnalysisData: TechnicalAnalysisConfig[] = [
  {
    analysisType: "power_failure",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration100",
  },

  {
    analysisType: "voltage_missing",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration100",
  },

  {
    analysisType: "voltage_unbalance",
    month: 1,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration100",
  },

  {
    analysisType: "low_voltage",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration100",
  },

  {
    analysisType: "over_voltage",
    month: 1,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration100",
  },

  {
    analysisType: "single_wire_operation",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "neutral_disturbance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "current_without_voltage",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "ct_open",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "current_bypass",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "current_unbalance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "earth_loading",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "low_power_factor",
    month: 11,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "phase_neutral_mismatch",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "phase",
  },

  {
    analysisType: "phase_zero_neutral_nonzero",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "phase",
  },

  {
    analysisType: "phase_nonzero_neutral_zero",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "phase",
  },

  {
    analysisType: "magnet_event",
    month: 9,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "count",
  },

  {
    analysisType: "cover_open",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "count",
  },

  {
    analysisType: "ynr_over_voltage",
    month: 1,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration100",
  },

  {
    analysisType: "ynr_neutral_disturbance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "ynr_ct_open_unbalance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration10",
  },

  {
    analysisType: "ynr_ct_bypass",
    month: 4,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration10",
  },

  {
    analysisType: "ynr_earth_loading",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration10",
  },

  {
    analysisType: "ynr_low_power_factor",
    month: 11,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "duration12",
  },

  {
    analysisType: "ynr_magnet_event",
    month: 9,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "count",
  },

  {
    analysisType: "ynr_cover_open",
    month: 12,
    year: 2024,
    hasData: false,
    pageSize: 100,
    maxResponseTime: 10000,
    validationType: "count",
  },
];
