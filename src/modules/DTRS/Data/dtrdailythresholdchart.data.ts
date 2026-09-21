import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrDailyThresholdChartQuery } from "../Api/dtrdailythresholdchart.api";
import type {
  DtrDailyThresholdChartResponse,
  DtrDailyThresholdChartScenario,
  DtrDailyThresholdPeriod,
  ThresholdChartPoint,
} from "../Mapper/dtrdailythresholdchart.mapper";

export const dtrDailyThresholdChartMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrDailyThresholdChartDefaultCode = "11IW3";

export const dtrDailyThresholdChartAltCode = "34SO21";

export const dtrDailyThresholdChartNotFoundCode = "INVALID_DTR_XYZ";

export const dtrDailyThresholdChartEmptyCode = " ";

export const dtrDailyThresholdPeriods = ["hourly", "daily", "weekly", "monthly", "yearly"] as const;

export const dtrDailyThresholdPeriodPointCounts: Record<DtrDailyThresholdPeriod, number> = {
  hourly: 12,
  daily: 12,
  weekly: 8,
  monthly: 12,
  yearly: 12,
};

export const dtrDailyThresholdPointFields = [
  "label",
  "activeEnergyKwh",
  "reactiveEnergyKvarh",
  "apparentEnergyKvah",
  "powerFactor",
] as const;

export const dtrDailyThresholdEnergyFields = [
  "activeEnergyKwh",
  "reactiveEnergyKvarh",
  "apparentEnergyKvah",
  "powerFactor",
] as const;

function nullPoint(label: string): ThresholdChartPoint {
  return {
    label,
    activeEnergyKwh: null,
    reactiveEnergyKvarh: null,
    apparentEnergyKvah: null,
    powerFactor: null,
  };
}

const hourlyLabels = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const dailyLabels = [
  "28 Jun",
  "29 Jun",
  "30 Jun",
  "1 Jul",
  "2 Jul",
  "3 Jul",
  "4 Jul",
  "5 Jul",
  "6 Jul",
  "7 Jul",
  "8 Jul",
  "9 Jul",
];

const weeklyLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

const monthlyLabels = [
  "Aug 2025",
  "Sept 2025",
  "Oct 2025",
  "Nov 2025",
  "Dec 2025",
  "Jan 2026",
  "Feb 2026",
  "Mar 2026",
  "Apr 2026",
  "May 2026",
  "Jun 2026",
  "Jul 2026",
];

const yearlyLabels = [
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
];

function buildNullChart(
  period: DtrDailyThresholdPeriod,
  labels: string[],
): DtrDailyThresholdChartResponse {
  return {
    success: true,
    data: {
      period,
      points: labels.map(nullPoint),
    },
  };
}

export const dtrDailyThresholdContractNullHourlyResponse = buildNullChart("hourly", hourlyLabels);

export const dtrDailyThresholdContractNullDailyResponse = buildNullChart("daily", dailyLabels);

export const dtrDailyThresholdContractNullWeeklyResponse = buildNullChart("weekly", weeklyLabels);

export const dtrDailyThresholdContractNullMonthlyResponse = buildNullChart(
  "monthly",
  monthlyLabels,
);

export const dtrDailyThresholdContractNullYearlyResponse = buildNullChart("yearly", yearlyLabels);

/** Populated bucket with meter PF; reactive derived from energy triangle. */
export const dtrDailyThresholdContractPopulatedResponse: DtrDailyThresholdChartResponse = {
  success: true,
  data: {
    period: "daily",
    points: [
      {
        label: "1 Jul",
        activeEnergyKwh: 15.5,
        reactiveEnergyKvarh: 8.2,
        apparentEnergyKvah: 17.5,
        powerFactor: 0.89,
      },
      {
        label: "2 Jul",
        activeEnergyKwh: 20,
        reactiveEnergyKvarh: null,
        apparentEnergyKvah: 25,
        powerFactor: 0.8,
      },
    ],
  },
};

/**
 * Reactive from √(kVAh² − kWh²): kWh 10, kVAh 12 → 6.63.
 */
export const dtrDailyThresholdContractReactiveMeta = {
  activeEnergyKwh: 10,
  apparentEnergyKvah: 12,
  expectedReactiveKvarh: 6.63,
};

export const dtrDailyThresholdContractReactiveResponse: DtrDailyThresholdChartResponse = {
  success: true,
  data: {
    period: "hourly",
    points: [
      {
        label: "10:00",
        activeEnergyKwh: dtrDailyThresholdContractReactiveMeta.activeEnergyKwh,
        reactiveEnergyKvarh: null,
        apparentEnergyKvah: dtrDailyThresholdContractReactiveMeta.apparentEnergyKvah,
        powerFactor: null,
      },
    ],
  },
};

/**
 * PF from kWh/kVAh: 10 / 12 → 0.83.
 */
export const dtrDailyThresholdContractPfMeta = {
  activeEnergyKwh: 10,
  apparentEnergyKvah: 12,
  expectedPowerFactor: 0.83,
};

export const dtrDailyThresholdContractPfResponse: DtrDailyThresholdChartResponse = {
  success: true,
  data: {
    period: "weekly",
    points: [
      {
        label: "W3",
        activeEnergyKwh: dtrDailyThresholdContractPfMeta.activeEnergyKwh,
        reactiveEnergyKvarh: null,
        apparentEnergyKvah: dtrDailyThresholdContractPfMeta.apparentEnergyKvah,
        powerFactor: null,
      },
    ],
  },
};

export const dtrDailyThresholdContractEmptyPointsResponse: DtrDailyThresholdChartResponse = {
  success: true,
  data: {
    period: "daily",
    points: [],
  },
};

export const dtrDailyThresholdContractUniqueLabelsResponse: DtrDailyThresholdChartResponse = {
  success: true,
  data: {
    period: "daily",
    points: [
      {
        label: "1 Sept",
        activeEnergyKwh: 10,
        reactiveEnergyKvarh: 6,
        apparentEnergyKvah: 12,
        powerFactor: 0.83,
      },
      {
        label: "2 Sept",
        activeEnergyKwh: 11,
        reactiveEnergyKvarh: 6.63,
        apparentEnergyKvah: 13,
        powerFactor: 0.85,
      },
    ],
  },
};

export interface DtrDailyThresholdChartTestCase {
  testName: string;
  scenario: DtrDailyThresholdChartScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDtrDailyThresholdChartPeriod(
  scenario: DtrDailyThresholdChartScenario,
): DtrDailyThresholdPeriod | undefined {
  switch (scenario) {
    case "ddt_by_code_primary_hourly":
    case "contract_null_hourly":
    case "contract_reactive_derivation":
      return "hourly";
    case "ddt_by_code_primary_daily":
    case "contract_null_daily":
    case "contract_populated_energy":
    case "contract_unique_labels":
    case "contract_empty_points":
      return "daily";
    case "ddt_by_code_primary_weekly":
    case "contract_null_weekly":
    case "contract_pf_from_energy":
      return "weekly";
    case "ddt_by_code_primary_monthly":
    case "contract_null_monthly":
      return "monthly";
    case "ddt_by_code_primary_yearly":
    case "contract_null_yearly":
      return "yearly";
    case "ddt_by_code_alt":
    case "ddt_ignore_unknown_query":
      return "daily";
    case "ddt_uppercase_period":
    case "ddt_missing_period":
    case "ddt_blank_period":
    case "dtr_not_found":
    case "empty_dtr_code":
    case "invalid_period":
    default:
      return undefined;
  }
}

export function resolveDtrDailyThresholdChartCode(
  scenario: DtrDailyThresholdChartScenario,
): string | undefined {
  switch (scenario) {
    case "ddt_by_code_primary_hourly":
    case "ddt_by_code_primary_daily":
    case "ddt_by_code_primary_weekly":
    case "ddt_by_code_primary_monthly":
    case "ddt_by_code_primary_yearly":
    case "ddt_ignore_unknown_query":
    case "ddt_missing_period":
    case "ddt_blank_period":
    case "ddt_uppercase_period":
    case "invalid_period":
      return (
        process.env.DTR_DAILY_THRESHOLD_CHART_CODE?.trim() ||
        process.env.DTR_FEEDERS_CODE?.trim() ||
        process.env.DTR_PROFILE_CODE?.trim() ||
        dtrDailyThresholdChartDefaultCode
      );
    case "ddt_by_code_alt":
      return (
        process.env.DTR_DAILY_THRESHOLD_CHART_CODE_ALT?.trim() ||
        process.env.DTR_FEEDERS_CODE_ALT?.trim() ||
        dtrDailyThresholdChartAltCode
      );
    case "dtr_not_found":
      return dtrDailyThresholdChartNotFoundCode;
    case "empty_dtr_code":
      return dtrDailyThresholdChartEmptyCode;
    case "contract_null_hourly":
    case "contract_null_daily":
    case "contract_null_weekly":
    case "contract_null_monthly":
    case "contract_null_yearly":
    case "contract_populated_energy":
    case "contract_reactive_derivation":
    case "contract_pf_from_energy":
    case "contract_empty_points":
    case "contract_unique_labels":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrDailyThresholdChartQuery(
  scenario: DtrDailyThresholdChartScenario,
): DtrDailyThresholdChartQuery {
  if (scenario === "invalid_period") {
    return { period: "invalid" };
  }
  if (scenario === "ddt_blank_period") {
    return { period: "" };
  }
  if (scenario === "ddt_uppercase_period") {
    return { period: "DAILY" };
  }
  if (scenario === "ddt_missing_period") {
    return {};
  }

  const period = resolveDtrDailyThresholdChartPeriod(scenario);
  if (scenario === "ddt_ignore_unknown_query") {
    return { period, foo: 1, bar: "baz" };
  }
  if (!period) {
    return {};
  }
  return { period };
}

export function resolveDtrDailyThresholdChartContractBody(
  scenario: DtrDailyThresholdChartScenario,
): DtrDailyThresholdChartResponse | undefined {
  switch (scenario) {
    case "contract_null_hourly":
      return dtrDailyThresholdContractNullHourlyResponse;
    case "contract_null_daily":
      return dtrDailyThresholdContractNullDailyResponse;
    case "contract_null_weekly":
      return dtrDailyThresholdContractNullWeeklyResponse;
    case "contract_null_monthly":
      return dtrDailyThresholdContractNullMonthlyResponse;
    case "contract_null_yearly":
      return dtrDailyThresholdContractNullYearlyResponse;
    case "contract_populated_energy":
      return dtrDailyThresholdContractPopulatedResponse;
    case "contract_reactive_derivation":
      return dtrDailyThresholdContractReactiveResponse;
    case "contract_pf_from_energy":
      return dtrDailyThresholdContractPfResponse;
    case "contract_empty_points":
      return dtrDailyThresholdContractEmptyPointsResponse;
    case "contract_unique_labels":
      return dtrDailyThresholdContractUniqueLabelsResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrDailyThresholdChartCode — kept for backward compatibility. */
export const dtrDailyThresholdChartData = {
  dtrCode: dtrDailyThresholdChartDefaultCode,
  maxResponseTime: dtrDailyThresholdChartMaxResponseTimeMs,
  periods: dtrDailyThresholdPeriods,
  pointFields: dtrDailyThresholdPointFields,
};

export const dtrDailyThresholdChartTestCases: DtrDailyThresholdChartTestCase[] = [
  {
    testName: "DTR energy over time — hour by hour, each hour listed once",
    scenario: "ddt_by_code_primary_hourly",
    tags: ["@smoke", "@dtr", "@daily-threshold-chart"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR energy over time — day by day, each day listed once",
    scenario: "ddt_by_code_primary_daily",
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — week by week, each week listed once",
    scenario: "ddt_by_code_primary_weekly",
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — a second transformer still shows a chart",
    scenario: "ddt_by_code_alt",
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — extra filters that nobody uses are ignored",
    scenario: "ddt_ignore_unknown_query",
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — DAILY in capital letters still works or is rejected",
    scenario: "ddt_uppercase_period",
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — hours with no energy yet",
    scenario: "contract_null_hourly",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — days with no energy yet",
    scenario: "contract_null_daily",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — weeks with no energy yet",
    scenario: "contract_null_weekly",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — months with no energy yet, each month listed once",
    scenario: "contract_null_monthly",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — years with no energy yet, each year listed once",
    scenario: "contract_null_yearly",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — days with energy, power factor, and reactive energy",
    scenario: "contract_populated_energy",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — reactive energy calculated from kWh and kVAh",
    scenario: "contract_reactive_derivation",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — power factor calculated from kWh and kVAh",
    scenario: "contract_pf_from_energy",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — no points yet is allowed",
    scenario: "contract_empty_points",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample chart — 1 Sept and 2 Sept each appear only once",
    scenario: "contract_unique_labels",
    isContractFixture: true,
    tags: ["@dtr", "@daily-threshold-chart", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — unknown transformer is not shown",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@daily-threshold-chart", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — a blank transformer code is not allowed",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@daily-threshold-chart", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — a blank time grouping is not allowed",
    scenario: "ddt_blank_period",
    expectedStatus: 400,
    tags: ["@dtr", "@daily-threshold-chart", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR energy over time — an unknown time grouping is not allowed",
    scenario: "invalid_period",
    expectedStatus: 400,
    tags: ["@dtr", "@daily-threshold-chart", "@negative"],
    nonEmptyExpected: false,
  },
];
