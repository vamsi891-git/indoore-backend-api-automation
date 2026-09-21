import {
  TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
  TECHNICAL_ANALYSIS_PHASE_MAX_RESPONSE_TIME_MS,
  TECHNICAL_ANALYSIS_PHASE_PAGE_SIZE,
} from "../../../core/constants/api-timeouts";
import type { TechnicalReportQuery } from "../Api/technicalanalysis.api";
import type {
  TechnicalReportResponse,
  TechnicalReportRow,
} from "../Mapper/technicalanalysis.mapper";

export interface TechnicalAnalysisLiveConfig {
  analysisType: string;
  month: number;
  year: number;
  hasData: boolean;
  pageSize: number;
  maxResponseTime: number;
  validationType: "duration100" | "duration12" | "duration10" | "count" | "phase";
}

export const technicalAnalysisDefaultAnalysisType = "power_failure";
export const technicalAnalysisDefaultMonth = 10;
export const technicalAnalysisDefaultYear = 2025;
export const technicalAnalysisDefaultPageSize = 100;

export const technicalAnalysisReportNames: Record<string, string> = {
  power_failure: "Power Failure",
  voltage_missing: "Voltage Missing",
  voltage_unbalance: "Voltage Unbalance",
  low_voltage: "Low Voltage in any Phase",
  over_voltage: "Over Voltage in any phase",
  single_wire_operation: "Single Wire Operation",
  neutral_disturbance: "Neutral Disturbance",
  current_without_voltage: "Current Without Voltage",
  ct_open: "CT Open",
  current_bypass: "Current Bypass",
  current_unbalance: "Current Unbalance",
  earth_loading: "Earth Loading",
  low_power_factor: "Low Power Factor",
  phase_neutral_mismatch: "Ip!=In (Phase current is not equal to neutral current)",
  phase_zero_neutral_nonzero: "Ip=0 & In!=0",
  phase_nonzero_neutral_zero: "Ip!=0 & In=0",
  magnet_event: "Magnet Event",
  cover_open: "Cover Open",
  ynr_over_voltage: "Over Voltage in any phase",
  ynr_neutral_disturbance: "Neutral Disturbance",
  ynr_ct_open_unbalance: "CT Open/Unbalance in any phase",
  ynr_ct_bypass: "CT Bypass",
  ynr_earth_loading: "Earth Loading",
  ynr_low_power_factor: "Low Power Factor",
  ynr_magnet_event: "Magnet Event",
  ynr_cover_open: "Cover Open",
};

export function technicalAnalysisReportTitle(analysisType: string): string {
  const name = technicalAnalysisReportNames[analysisType] ?? analysisType;
  return analysisType.startsWith("ynr_") ? `YNR ${name}` : name;
}

/** Empty duration reports (e.g. CT Open) omit Duration in Hours. */
export const EXPECTED_TECHNICAL_EVENT_COLUMNS = [
  { key: "subDivision", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "name", header: "Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "category", header: "Category" },
  { key: "msn", header: "MSN" },
  { key: "phase", header: "Phase" },
  { key: "eventName", header: "Event_name" },
] as const;

/** Live duration grids with meters. Empty duration reports omit this last column. */
export const EXPECTED_TECHNICAL_DURATION_COLUMNS = [
  ...EXPECTED_TECHNICAL_EVENT_COLUMNS,
  { key: "durationInHours", header: "Duration in Hours" },
] as const;

/** YNR duration grids include occurrence time (API header spelling) plus duration. */
export const EXPECTED_TECHNICAL_YNR_DURATION_COLUMNS = [
  ...EXPECTED_TECHNICAL_EVENT_COLUMNS,
  { key: "occurrenceTime", header: "Occurence_Time" },
  { key: "durationInHours", header: "Duration in Hours" },
] as const;

export const technicalAnalysisLiveConfigs: TechnicalAnalysisLiveConfig[] = [
  {
    analysisType: "power_failure",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "voltage_missing",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "voltage_unbalance",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "low_voltage",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "over_voltage",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "single_wire_operation",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "neutral_disturbance",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "current_without_voltage",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "ct_open",
    month: 10,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "current_bypass",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "current_unbalance",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "earth_loading",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "low_power_factor",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "phase_neutral_mismatch",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: TECHNICAL_ANALYSIS_PHASE_PAGE_SIZE,
    maxResponseTime: TECHNICAL_ANALYSIS_PHASE_MAX_RESPONSE_TIME_MS,
    validationType: "phase",
  },
  {
    analysisType: "phase_zero_neutral_nonzero",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: TECHNICAL_ANALYSIS_PHASE_PAGE_SIZE,
    maxResponseTime: TECHNICAL_ANALYSIS_PHASE_MAX_RESPONSE_TIME_MS,
    validationType: "phase",
  },
  {
    analysisType: "phase_nonzero_neutral_zero",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: TECHNICAL_ANALYSIS_PHASE_PAGE_SIZE,
    maxResponseTime: TECHNICAL_ANALYSIS_PHASE_MAX_RESPONSE_TIME_MS,
    validationType: "phase",
  },
  {
    analysisType: "magnet_event",
    month: 10,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
  {
    analysisType: "cover_open",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
  {
    analysisType: "ynr_over_voltage",
    month: 10,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "ynr_neutral_disturbance",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "ynr_ct_open_unbalance",
    month: 10,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration10",
  },
  {
    analysisType: "ynr_ct_bypass",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration10",
  },
  {
    analysisType: "ynr_earth_loading",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration10",
  },
  {
    analysisType: "ynr_low_power_factor",
    month: 10,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "ynr_magnet_event",
    month: 10,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
  {
    analysisType: "ynr_cover_open",
    month: 10,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
];

/** @deprecated Use technicalAnalysisLiveConfigs */
export type TechnicalAnalysisConfig = TechnicalAnalysisLiveConfig;

/** @deprecated Use technicalAnalysisLiveConfigs */
export const TechnicalAnalysisData = technicalAnalysisLiveConfigs;

export type TechnicalReportScenario =
  | "dev_live_report"
  | "dev_page_beyond"
  | "dev_custom_page_size"
  | "dev_category_domestic"
  | "dev_category_non_domestic"
  | "dev_ignore_unknown_query"
  | "contract_empty_page"
  | "contract_duration_row"
  | "invalid_analysis_type"
  | "missing_analysis_type"
  | "invalid_month"
  | "missing_month"
  | "invalid_page_size_zero";

export interface TechnicalReportTestCase {
  testName: string;
  scenario: TechnicalReportScenario;
  tags: string[];
  expectedStatus?: number;
  isContractFixture?: boolean;
  liveConfig?: TechnicalAnalysisLiveConfig;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

const contractDurationRow: TechnicalReportRow = {
  id: "row-1",
  meterLookupId: 12345,
  subDivision: "SUB DIV 1",
  subStation: "SS-1",
  feeder: "FEEDER-1",
  dtr: "DTR-1",
  name: "Consumer One",
  address: "Address line",
  ivrsNumber: "N1234567890",
  category: "domestic",
  msn: "7060001",
  phase: "TP",
  durationInHours: 120,
  eventName: "Power Failure",
};

export const technicalReportContractEmptyResponse: TechnicalReportResponse = {
  success: true,
  data: {
    columns: [],
    rows: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  },
};

export const technicalReportContractDurationRowResponse: TechnicalReportResponse = {
  success: true,
  data: {
    columns: [],
    rows: [contractDurationRow],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export function resolveTechnicalReportContractBody(
  scenario: TechnicalReportScenario,
): TechnicalReportResponse | undefined {
  switch (scenario) {
    case "contract_empty_page":
      return technicalReportContractEmptyResponse;
    case "contract_duration_row":
      return technicalReportContractDurationRowResponse;
    default:
      return undefined;
  }
}

export function resolveTechnicalReportQuery(
  scenario: TechnicalReportScenario,
  liveConfig?: TechnicalAnalysisLiveConfig,
): TechnicalReportQuery {
  const base = liveConfig ?? {
    analysisType: technicalAnalysisDefaultAnalysisType,
    month: technicalAnalysisDefaultMonth,
    year: technicalAnalysisDefaultYear,
    pageSize: technicalAnalysisDefaultPageSize,
  };

  switch (scenario) {
    case "dev_live_report":
      return {
        analysisType: base.analysisType,
        month: base.month,
        year: base.year,
        category: "total",
        pageSize: base.pageSize,
        page: 1,
      };
    case "dev_page_beyond":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 5,
        page: 999,
      };
    case "dev_custom_page_size":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 5,
        page: 1,
      };
    case "dev_category_domestic":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "domestic",
        pageSize: 10,
        page: 1,
      };
    case "dev_category_non_domestic":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "non-domestic",
        pageSize: 10,
        page: 1,
      };
    case "dev_ignore_unknown_query":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 10,
        page: 1,
        unknownParam: "ignored",
      };
    case "invalid_analysis_type":
      return {
        analysisType: "not_a_real_analysis_type",
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 10,
      };
    case "missing_analysis_type":
      return {
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 10,
      };
    case "invalid_month":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: 13,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 10,
      };
    case "missing_month":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 10,
      };
    case "invalid_page_size_zero":
      return {
        analysisType: technicalAnalysisDefaultAnalysisType,
        month: technicalAnalysisDefaultMonth,
        year: technicalAnalysisDefaultYear,
        category: "total",
        pageSize: 0,
      };
    default:
      return {
        analysisType: base.analysisType,
        month: base.month,
        year: base.year,
        category: "total",
        pageSize: base.pageSize,
        page: 1,
      };
  }
}

const technicalReportEdgeCases: TechnicalReportTestCase[] = [
  {
    testName: "Technical report — a page past the last page shows no records",
    scenario: "dev_page_beyond",
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — a smaller page size shows fewer records",
    scenario: "dev_custom_page_size",
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — household filter shows household meters",
    scenario: "dev_category_domestic",
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — non-household filter shows non-household meters",
    scenario: "dev_category_non_domestic",
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — duration row fixture",
    scenario: "contract_duration_row",
    isContractFixture: true,
    tags: ["@technical-analysis", "@report", "@edge"],
    nonEmptyExpected: false,
  },
];

const technicalReportNegativeCases: TechnicalReportTestCase[] = [
  {
    testName: "Technical report — unknown analysis type is rejected",
    scenario: "invalid_analysis_type",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — missing analysis type is rejected",
    scenario: "missing_analysis_type",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — invalid month is rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical report — page size zero is rejected",
    scenario: "invalid_page_size_zero",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
    nonEmptyExpected: false,
  },
];

const technicalReportLiveCases: TechnicalReportTestCase[] = technicalAnalysisLiveConfigs.map(
  (liveConfig) => ({
    testName: liveConfig.hasData
      ? `${technicalAnalysisReportTitle(liveConfig.analysisType)} report — first page shows columns and meters`
      : `${technicalAnalysisReportTitle(liveConfig.analysisType)} report — empty list is valid`,
    scenario: "dev_live_report",
    liveConfig,
    tags: ["@technical-analysis", "@report", "@smoke"],
    nonEmptyExpected: true,
  }),
);

export const technicalReportTestCases: TechnicalReportTestCase[] = [
  ...technicalReportLiveCases,
  ...technicalReportEdgeCases,
  ...technicalReportNegativeCases,
];

export function getTechnicalReportLiveConfig(
  testCase: TechnicalReportTestCase,
): TechnicalAnalysisLiveConfig | undefined {
  return testCase.liveConfig;
}
