import { TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { TechnicalSummaryQuery } from "../Api/technical-summary.api";
import type { TechnicalSummaryResponse } from "../Mapper/technical-summary.mapper";
export const technicalSummaryMaxResponseTimeMs = TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS;
export const technicalSummaryDefaultMonth = 10;
export const technicalSummaryDefaultYear = 2025;
/** Alternate period — same covered month until another OLD8 window is confirmed. */
export const technicalSummaryAltMonth = 10;
export const technicalSummaryAltYear = 2025;

/** All 26 summary cards for October 2025, including empty reports. */
export const technicalSummaryExpectedAnalysisTypes = [
  "power_failure",
  "voltage_missing",
  "voltage_unbalance",
  "low_voltage",
  "over_voltage",
  "single_wire_operation",
  "neutral_disturbance",
  "current_without_voltage",
  "ct_open",
  "current_bypass",
  "current_unbalance",
  "earth_loading",
  "low_power_factor",
  "phase_neutral_mismatch",
  "phase_zero_neutral_nonzero",
  "phase_nonzero_neutral_zero",
  "magnet_event",
  "cover_open",
  "ynr_over_voltage",
  "ynr_neutral_disturbance",
  "ynr_ct_open_unbalance",
  "ynr_ct_bypass",
  "ynr_earth_loading",
  "ynr_low_power_factor",
  "ynr_magnet_event",
  "ynr_cover_open",
] as const;

export const technicalSummaryExpectedReportCount = technicalSummaryExpectedAnalysisTypes.length;

export { technicalAnalysisReportNames as technicalSummaryReportNames } from "./technicalanalysis.data";

export const technicalSummaryTechnicalTypes = technicalSummaryExpectedAnalysisTypes.filter(
  (type) => !type.startsWith("ynr_"),
);
export const technicalSummaryYnrTypes = technicalSummaryExpectedAnalysisTypes.filter((type) =>
  type.startsWith("ynr_"),
);

export type TechnicalSummaryScenario =
  | "dev_live_primary"
  | "dev_live_alt_month"
  | "invalid_month_zero"
  | "invalid_month_13"
  | "missing_month"
  | "missing_year";
export interface TechnicalSummaryTestCase {
  testName: string;
  scenario: TechnicalSummaryScenario;
  tags: string[];
  expectedStatus?: number;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}
export function resolveTechnicalSummaryQuery(
  scenario: TechnicalSummaryScenario,
): TechnicalSummaryQuery {
  switch (scenario) {
    case "dev_live_primary":
      return {
        month: technicalSummaryDefaultMonth,
        year: technicalSummaryDefaultYear,
      };
    case "dev_live_alt_month":
      return {
        month: technicalSummaryAltMonth,
        year: technicalSummaryAltYear,
      };
    case "invalid_month_zero":
      return { month: 0, year: technicalSummaryDefaultYear };
    case "invalid_month_13":
      return { month: 13, year: technicalSummaryDefaultYear };
    case "missing_month":
      return { year: technicalSummaryDefaultYear };
    case "missing_year":
      return { month: technicalSummaryDefaultMonth };
    default:
      return {
        month: technicalSummaryDefaultMonth,
        year: technicalSummaryDefaultYear,
      };
  }
}

export const technicalSummaryContractEmptyResponse: TechnicalSummaryResponse = {
  success: true,
  data: {
    month: technicalSummaryDefaultMonth,
    year: technicalSummaryDefaultYear,
    reports: [],
  },
};

/** @deprecated Use named exports from this module. */
export const technicalSummaryData = {
  month: technicalSummaryDefaultMonth,
  year: technicalSummaryDefaultYear,
};

export const technicalSummaryTestCases: TechnicalSummaryTestCase[] = [
  {
    testName: "Technical summary — month zero is rejected",
    scenario: "invalid_month_zero",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical summary — month 13 is rejected",
    scenario: "invalid_month_13",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical summary — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical summary — missing year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@technical", "@technical-summary", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Technical summary — October 2025 cards show counts",
    scenario: "dev_live_primary",
    tags: ["@technical", "@technical-summary", "@smoke"],
    nonEmptyExpected: true,
  },
  {
    testName: "Technical summary — alternate period still opens",
    scenario: "dev_live_alt_month",
    tags: ["@technical", "@technical-summary", "@edge"],
    nonEmptyExpected: false,
  },
];
