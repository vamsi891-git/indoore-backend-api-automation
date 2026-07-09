import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EnergyFlowQuery } from "../Api/energyflow.api";
import type {
  EnergyFlowPoint,
  EnergyFlowResponse,
  EnergyFlowScenario,
  EnergyFlowPeriod,
} from "../Mapper/energyflow.mapper";

export const energyFlowMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** IVRS from user request; live archive may return all-zero cumulative registers. */
export const energyFlowDefaultIvrs = "N3374018980";

export const energyFlowDefaultConsumerId = "N3374018980";

export const energyFlowDefaultMeterRoute = "meter-12345";

export const energyFlowNotFoundRef = "INVALID_CONSUMER_XYZ";

export const energyFlowMeterNotFoundRef = "meter-999999999";

export const energyFlowEmptyRef = " ";

/**
 * Backend CONSUMER_ENERGY_FLOW_BUCKET_COUNT (energyFlow view).
 * Differs from consumption graph (12/12/8/12/12).
 */
export const ENERGY_FLOW_POINT_COUNT: Record<EnergyFlowPeriod, number> = {
  hourly: 6,
  daily: 6,
  weekly: 4,
  monthly: 6,
  yearly: 6,
};

function zeroFlowPoints(labels: readonly string[]): EnergyFlowPoint[] {
  return labels.map((label) => ({
    label,
    kwhImport: 0,
    kvahImport: 0,
    kwhExport: 0,
    kvahExport: 0,
  }));
}

const ZERO_HOURLY_LABELS = [
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
] as const;

/** User-provided daily sample (6 points, all zeros). */
const ZERO_DAILY_LABELS = [
  "4 Jul",
  "5 Jul",
  "6 Jul",
  "7 Jul",
  "8 Jul",
  "9 Jul",
] as const;

const ZERO_WEEKLY_LABELS = ["W1", "W2", "W3", "W4"] as const;

const ZERO_MONTHLY_LABELS = [
  "Feb 2026",
  "Mar 2026",
  "Apr 2026",
  "May 2026",
  "Jun 2026",
  "Jul 2026",
] as const;

const ZERO_YEARLY_LABELS = [
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
] as const;

/** User-provided hourly sample (6 rolling IST hours, all zeros). */
export const energyFlowContractHourlyResponse: EnergyFlowResponse = {
  success: true,
  data: {
    period: "hourly",
    points: zeroFlowPoints(ZERO_HOURLY_LABELS),
  },
};

/** User-provided daily sample (6 points). */
export const energyFlowContractDailyResponse: EnergyFlowResponse = {
  success: true,
  data: {
    period: "daily",
    points: zeroFlowPoints(ZERO_DAILY_LABELS),
  },
};

export const energyFlowContractWeeklyResponse: EnergyFlowResponse = {
  success: true,
  data: {
    period: "weekly",
    points: zeroFlowPoints(ZERO_WEEKLY_LABELS),
  },
};

export const energyFlowContractMonthlyResponse: EnergyFlowResponse = {
  success: true,
  data: {
    period: "monthly",
    points: zeroFlowPoints(ZERO_MONTHLY_LABELS),
  },
};

export const energyFlowContractYearlyResponse: EnergyFlowResponse = {
  success: true,
  data: {
    period: "yearly",
    points: zeroFlowPoints(ZERO_YEARLY_LABELS),
  },
};

/**
 * Cumulative register values at bucket end (energyFlow view).
 * Series is non-decreasing — carry-forward when no new reading.
 */
export const energyFlowContractCumulativeNonzeroResponse: EnergyFlowResponse = {
  success: true,
  data: {
    period: "daily",
    points: [
      {
        label: "4 Jul",
        kwhImport: 100,
        kvahImport: 110,
        kwhExport: 0,
        kvahExport: 0,
      },
      {
        label: "5 Jul",
        kwhImport: 100,
        kvahImport: 110,
        kwhExport: 0,
        kvahExport: 0,
      },
      {
        label: "6 Jul",
        kwhImport: 105.5,
        kvahImport: 116.2,
        kwhExport: 1.25,
        kvahExport: 1.3,
      },
      {
        label: "7 Jul",
        kwhImport: 110,
        kvahImport: 121,
        kwhExport: 1.25,
        kvahExport: 1.3,
      },
      {
        label: "8 Jul",
        kwhImport: 110,
        kvahImport: 121,
        kwhExport: 2,
        kvahExport: 2.1,
      },
      {
        label: "9 Jul",
        kwhImport: 125.33,
        kvahImport: 138.5,
        kwhExport: 2,
        kvahExport: 2.1,
      },
    ],
  },
};

/**
 * Proves consumption graph deltas derive from cumulative energy-flow registers.
 * cumulativeAtWindowStart mirrors reading at plan.windowStart before first bucket.
 */
export const energyFlowContractConsumptionFormulaMeta = {
  cumulativeAtWindowStart: {
    kwhImport: 85,
    kvahImport: 93,
    kwhExport: 0,
    kvahExport: 0,
  },
  expectedConsumptionKwh: [15, 0, 5.5, 4.5, 0, 15.33],
  expectedConsumptionKvah: [17, 0, 6.2, 4.8, 0, 17.5],
} as const;

export const energyFlowContractConsumptionFormulaResponse: EnergyFlowResponse =
  energyFlowContractCumulativeNonzeroResponse;

export interface EnergyFlowTestCase {
  testName: string;
  scenario: EnergyFlowScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveEnergyFlowRef(
  scenario: EnergyFlowScenario,
): string | undefined {
  switch (scenario) {
    case "ef_by_ivrs_daily":
    case "ef_period_hourly":
    case "ef_period_weekly":
    case "ef_period_monthly":
    case "ef_period_yearly":
    case "ef_ignore_unknown_query":
    case "invalid_period":
      return (
        process.env.CONSUMER_EF_IVRS?.trim() ||
        process.env.CONSUMER_ECG_IVRS?.trim() ||
        process.env.CONSUMER_LLP_IVRS?.trim() ||
        energyFlowDefaultIvrs
      );
    case "ef_by_account":
      return (
        process.env.CONSUMER_EF_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_ECG_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_LLP_CONSUMER_ID?.trim() ||
        energyFlowDefaultConsumerId
      );
    case "ef_by_meter":
      return (
        process.env.CONSUMER_EF_METER_ROUTE?.trim() ||
        process.env.CONSUMER_ECG_METER_ROUTE?.trim() ||
        process.env.CONSUMER_LLP_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        energyFlowDefaultMeterRoute
      );
    case "consumer_not_found":
      return energyFlowNotFoundRef;
    case "meter_not_found":
      return energyFlowMeterNotFoundRef;
    case "empty_consumer_ref":
      return energyFlowEmptyRef;
    case "contract_hourly":
    case "contract_daily":
    case "contract_weekly":
    case "contract_monthly":
    case "contract_yearly":
    case "contract_cumulative_nonzero":
    case "contract_consumption_formula":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveEnergyFlowQuery(
  scenario: EnergyFlowScenario,
): EnergyFlowQuery {
  switch (scenario) {
    case "ef_period_hourly":
      return { period: "hourly" };
    case "ef_period_weekly":
      return { period: "weekly" };
    case "ef_period_monthly":
      return { period: "monthly" };
    case "ef_period_yearly":
      return { period: "yearly" };
    case "invalid_period":
      return { period: "invalid" };
    case "ef_ignore_unknown_query":
      return { period: "daily", foo: 1 };
    case "ef_by_ivrs_daily":
    case "ef_by_account":
    case "ef_by_meter":
    case "consumer_not_found":
    case "meter_not_found":
    case "empty_consumer_ref":
    default:
      return { period: "daily" };
  }
}

export function resolveEnergyFlowExpectedPeriod(
  scenario: EnergyFlowScenario,
): EnergyFlowPeriod {
  const query = resolveEnergyFlowQuery(scenario);
  const period = query.period;
  if (
    period === "hourly" ||
    period === "daily" ||
    period === "weekly" ||
    period === "monthly" ||
    period === "yearly"
  ) {
    return period;
  }
  return "daily";
}

export function resolveEnergyFlowContractBody(
  scenario: EnergyFlowScenario,
): EnergyFlowResponse | undefined {
  switch (scenario) {
    case "contract_hourly":
      return energyFlowContractHourlyResponse;
    case "contract_daily":
      return energyFlowContractDailyResponse;
    case "contract_weekly":
      return energyFlowContractWeeklyResponse;
    case "contract_monthly":
      return energyFlowContractMonthlyResponse;
    case "contract_yearly":
      return energyFlowContractYearlyResponse;
    case "contract_cumulative_nonzero":
      return energyFlowContractCumulativeNonzeroResponse;
    case "contract_consumption_formula":
      return energyFlowContractConsumptionFormulaResponse;
    default:
      return undefined;
  }
}

export const energyFlowTestCases: EnergyFlowTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow?period=daily — success with cumulative chart points",
    scenario: "ef_by_ivrs_daily",
    tags: ["@smoke", "@consumer", "@energy-flow"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow?period=hourly — rolling 6 IST hours",
    scenario: "ef_period_hourly",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow?period=weekly — 4 week buckets",
    scenario: "ef_period_weekly",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow?period=monthly — 6 month buckets",
    scenario: "ef_period_monthly",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow?period=yearly — 6 year buckets",
    scenario: "ef_period_yearly",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/energy-flow — resolve by account id",
    scenario: "ef_by_account",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/energy-flow — resolve by meter lookup id",
    scenario: "ef_by_meter",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow — unknown query params ignored",
    scenario: "ef_ignore_unknown_query",
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — hourly period with 6 HH:00 labels and cumulative energy fields",
    scenario: "contract_hourly",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — daily period with 6 day labels (D Mon) and cumulative energy fields",
    scenario: "contract_daily",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — weekly period with W1–W4 labels and cumulative energy fields",
    scenario: "contract_weekly",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — monthly period with Mon YYYY labels and cumulative energy fields",
    scenario: "contract_monthly",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — yearly period with 4-digit year labels and cumulative energy fields",
    scenario: "contract_yearly",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — daily cumulative registers non-decreasing with roundEnergy (energyFlow view)",
    scenario: "contract_cumulative_nonzero",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Contract — consumption deltas match max(0, endCumulative − startCumulative) per bucket",
    scenario: "contract_consumption_formula",
    isContractFixture: true,
    tags: ["@consumer", "@energy-flow", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/energy-flow — consumer not found",
    scenario: "consumer_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@energy-flow", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/energy-flow — unknown meter not found or empty chart",
    scenario: "meter_not_found",
    tags: ["@consumer", "@energy-flow", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/energy-flow — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@energy-flow", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/energy-flow — invalid period enum rejected",
    scenario: "invalid_period",
    expectedStatus: 400,
    tags: ["@consumer", "@energy-flow", "@negative"],
  },
];
