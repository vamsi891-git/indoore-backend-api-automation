import { TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
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
  validationType:
    | "duration100"
    | "duration12"
    | "duration10"
    | "count"
    | "phase";
}

export const technicalAnalysisDefaultAnalysisType = "power_failure";
export const technicalAnalysisDefaultMonth = 12;
export const technicalAnalysisDefaultYear = 2025;
export const technicalAnalysisDefaultPageSize = 100;

export const technicalAnalysisLiveConfigs: TechnicalAnalysisLiveConfig[] = [
  {
    analysisType: "power_failure",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "voltage_missing",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "voltage_unbalance",
    month: 1,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "low_voltage",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "over_voltage",
    month: 1,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "single_wire_operation",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "neutral_disturbance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "current_without_voltage",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "ct_open",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "current_bypass",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "current_unbalance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "earth_loading",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "low_power_factor",
    month: 11,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "phase_neutral_mismatch",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "phase",
  },
  {
    analysisType: "phase_zero_neutral_nonzero",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "phase",
  },
  {
    analysisType: "phase_nonzero_neutral_zero",
    month: 12,
    year: 2025,
    hasData: false,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "phase",
  },
  {
    analysisType: "magnet_event",
    month: 9,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
  {
    analysisType: "cover_open",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
  {
    analysisType: "ynr_over_voltage",
    month: 1,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration100",
  },
  {
    analysisType: "ynr_neutral_disturbance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "ynr_ct_open_unbalance",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration10",
  },
  {
    analysisType: "ynr_ct_bypass",
    month: 4,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration10",
  },
  {
    analysisType: "ynr_earth_loading",
    month: 12,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration10",
  },
  {
    analysisType: "ynr_low_power_factor",
    month: 11,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "duration12",
  },
  {
    analysisType: "ynr_magnet_event",
    month: 9,
    year: 2025,
    hasData: true,
    pageSize: 100,
    maxResponseTime: TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS,
    validationType: "count",
  },
  {
    analysisType: "ynr_cover_open",
    month: 12,
    year: 2024,
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

export const technicalReportContractDurationRowResponse: TechnicalReportResponse =
  {
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
        category: "non_domestic",
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
    testName:
      "Validate GET /indore/analysis/technical/report — page beyond total returns empty rows",
    scenario: "dev_page_beyond",
    tags: ["@technical-analysis", "@report", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — custom pageSize",
    scenario: "dev_custom_page_size",
    tags: ["@technical-analysis", "@report", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — domestic category filter",
    scenario: "dev_category_domestic",
    tags: ["@technical-analysis", "@report", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — non-domestic category filter",
    scenario: "dev_category_non_domestic",
    tags: ["@technical-analysis", "@report", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — unknown query params ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@technical-analysis", "@report", "@edge"],
  },
  {
    testName: "Contract — empty rows with zero pagination total",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@technical-analysis", "@report", "@edge"],
  },
  {
    testName: "Contract — duration report row shape",
    scenario: "contract_duration_row",
    isContractFixture: true,
    tags: ["@technical-analysis", "@report", "@edge"],
  },
];

const technicalReportNegativeCases: TechnicalReportTestCase[] = [
  {
    testName:
      "Validate GET /indore/analysis/technical/report — invalid analysisType rejected",
    scenario: "invalid_analysis_type",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — missing analysisType rejected",
    scenario: "missing_analysis_type",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — invalid month rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — missing month rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/analysis/technical/report — pageSize zero rejected",
    scenario: "invalid_page_size_zero",
    expectedStatus: 400,
    tags: ["@technical-analysis", "@report", "@negative"],
  },
];

const technicalReportLiveCases: TechnicalReportTestCase[] =
  technicalAnalysisLiveConfigs.map((liveConfig) => ({
    testName: `Validate GET /indore/analysis/technical/report — ${liveConfig.analysisType} live report`,
    scenario: "dev_live_report",
    liveConfig,
    tags: ["@technical-analysis", "@report", "@smoke"],
  }));

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
