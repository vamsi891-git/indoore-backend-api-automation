import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EnergyConsumptionGraphQuery } from "../Api/energyconsumptiongraph.api";
import type {EnergyConsumptionGraphResponse,EnergyConsumptionGraphScenario,EnergyConsumptionPeriod,} from "../Mapper/energyconsumptiongraph.mapper";
import {
  CONSUMERS_LIVE_IVRS,
  CONSUMERS_LIVE_METER_ROUTE,
  resolveLiveAccountId,
  resolveLiveIvrs,
  resolveLiveMeterRoute,
} from "./consumers-live-refs";
export const energyConsumptionGraphMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** IVRS from live RTP/PQ sample; archive may return all-zero consumption. */
export const energyConsumptionGraphDefaultIvrs = CONSUMERS_LIVE_IVRS;
export const energyConsumptionGraphDefaultConsumerId = CONSUMERS_LIVE_IVRS;
export const energyConsumptionGraphDefaultMeterRoute = CONSUMERS_LIVE_METER_ROUTE;
export const energyConsumptionGraphNotFoundRef = "INVALID_CONSUMER_XYZ";
export const energyConsumptionGraphMeterNotFoundRef = "meter-999999999";
export const energyConsumptionGraphEmptyRef = " ";
/** Backend CONSUMER_CONSUMPTION_BUCKET_COUNT (consumption view). */
export const CONSUMPTION_POINT_COUNT: Record<EnergyConsumptionPeriod, number> =
  {
    hourly: 12,
    daily: 12,
    weekly: 8,
    monthly: 12,
    yearly: 12,
  };
const ZERO_HOURLY_LABELS = [
  "23:00",
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
] as const;
const ZERO_DAILY_LABELS = [
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
] as const;
const ZERO_WEEKLY_LABELS = [
  "W1",
  "W2",
  "W3",
  "W4",
  "W5",
  "W6",
  "W7",
  "W8",
] as const;
const ZERO_MONTHLY_LABELS = [
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
] as const;
const ZERO_YEARLY_LABELS = [
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
] as const;
function zeroPoints(labels: readonly string[]): {
  label: string;
  consumptionKwh: number;
}[] {
  return labels.map((label) => ({ label, consumptionKwh: 0 }));
}
/** User-provided hourly sample (all zeros). */
export const energyConsumptionGraphContractHourlyResponse: EnergyConsumptionGraphResponse =
  {
    success: true,
    data: {
      period: "hourly",
      points: zeroPoints(ZERO_HOURLY_LABELS),
    },
  };
/** User-provided daily sample (all zeros). */
export const energyConsumptionGraphContractDailyResponse: EnergyConsumptionGraphResponse =
  {
    success: true,
    data: {
      period: "daily",
      points: zeroPoints(ZERO_DAILY_LABELS),
    },
  };
/** User-provided weekly sample (all zeros). */
export const energyConsumptionGraphContractWeeklyResponse: EnergyConsumptionGraphResponse =
  {
    success: true,
    data: {
      period: "weekly",
      points: zeroPoints(ZERO_WEEKLY_LABELS),
    },
  };
/** User-provided monthly sample (all zeros). */
export const energyConsumptionGraphContractMonthlyResponse: EnergyConsumptionGraphResponse =
  {
    success: true,
    data: {
      period: "monthly",
      points: zeroPoints(ZERO_MONTHLY_LABELS),
    },
  };
/** User-provided yearly sample (all zeros). */
export const energyConsumptionGraphContractYearlyResponse: EnergyConsumptionGraphResponse =
  {
    success: true,
    data: {
      period: "yearly",
      points: zeroPoints(ZERO_YEARLY_LABELS),
    },
  };
/** Non-zero consumption deltas (backend roundEnergy to 2 decimals). */
export const energyConsumptionGraphContractNonzeroResponse: EnergyConsumptionGraphResponse =
  {
    success: true,
    data: {
      period: "daily",
      points: [
        { label: "1 Jul", consumptionKwh: 12.5 },
        { label: "2 Jul", consumptionKwh: 0 },
        { label: "3 Jul", consumptionKwh: 8.33 },
        { label: "4 Jul", consumptionKwh: 1.01 },
        { label: "5 Jul", consumptionKwh: 0 },
        { label: "6 Jul", consumptionKwh: 4.2 },
        { label: "7 Jul", consumptionKwh: 0.05 },
        { label: "8 Jul", consumptionKwh: 0 },
        { label: "9 Jul", consumptionKwh: 100 },
        { label: "10 Jul", consumptionKwh: 0.99 },
        { label: "11 Jul", consumptionKwh: 0 },
        { label: "12 Jul", consumptionKwh: 2.5 },
      ],
    },
  };
export interface EnergyConsumptionGraphTestCase {
  testName: string;
  scenario: EnergyConsumptionGraphScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}
export function resolveEnergyConsumptionGraphRef(
  scenario: EnergyConsumptionGraphScenario,
): string | undefined {
  switch (scenario) {
    case "ecg_by_ivrs_daily":
    case "ecg_period_hourly":
    case "ecg_period_weekly":
    case "ecg_period_monthly":
    case "ecg_period_yearly":
    case "ecg_ignore_unknown_query":
    case "invalid_period":
      return resolveLiveIvrs(
        process.env.CONSUMER_ECG_IVRS,
        process.env.CONSUMER_LLP_IVRS,
        energyConsumptionGraphDefaultIvrs,
      );
    case "ecg_by_account":
      return resolveLiveAccountId(
        process.env.CONSUMER_ECG_CONSUMER_ID,
        process.env.CONSUMER_LLP_CONSUMER_ID,
        energyConsumptionGraphDefaultConsumerId,
      );
    case "ecg_by_meter":
      return resolveLiveMeterRoute(
        process.env.CONSUMER_ECG_METER_ROUTE,
        process.env.CONSUMER_LLP_METER_ROUTE,
        process.env.CONSUMER_PROFILE_METER_ROUTE,
        energyConsumptionGraphDefaultMeterRoute,
      );
    case "consumer_not_found":
      return energyConsumptionGraphNotFoundRef;
    case "meter_not_found":
      return energyConsumptionGraphMeterNotFoundRef;
    case "empty_consumer_ref":
      return energyConsumptionGraphEmptyRef;
    case "contract_hourly":
    case "contract_daily":
    case "contract_weekly":
    case "contract_monthly":
    case "contract_yearly":
    case "contract_nonzero_consumption":
      return undefined;
    default:
      return undefined;
  }
}
export function resolveEnergyConsumptionGraphQuery(
  scenario: EnergyConsumptionGraphScenario,
): EnergyConsumptionGraphQuery {
  switch (scenario) {
    case "ecg_period_hourly":
      return { period: "hourly" };
    case "ecg_period_weekly":
      return { period: "weekly" };
    case "ecg_period_monthly":
      return { period: "monthly" };
    case "ecg_period_yearly":
      return { period: "yearly" };
    case "invalid_period":
      return { period: "invalid" };
    case "ecg_ignore_unknown_query":
      return { period: "daily", foo: 1 };
    case "ecg_by_ivrs_daily":
    case "ecg_by_account":
    case "ecg_by_meter":
    case "consumer_not_found":
    case "meter_not_found":
    case "empty_consumer_ref":
    default:
      return { period: "daily" };
  }
}
export function resolveEnergyConsumptionGraphExpectedPeriod(
  scenario: EnergyConsumptionGraphScenario,
): EnergyConsumptionPeriod {
  const query = resolveEnergyConsumptionGraphQuery(scenario);
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
export function resolveEnergyConsumptionGraphContractBody(
  scenario: EnergyConsumptionGraphScenario,
): EnergyConsumptionGraphResponse | undefined {
  switch (scenario) {
    case "contract_hourly":
      return energyConsumptionGraphContractHourlyResponse;
    case "contract_daily":
      return energyConsumptionGraphContractDailyResponse;
    case "contract_weekly":
      return energyConsumptionGraphContractWeeklyResponse;
    case "contract_monthly":
      return energyConsumptionGraphContractMonthlyResponse;
    case "contract_yearly":
      return energyConsumptionGraphContractYearlyResponse;
    case "contract_nonzero_consumption":
      return energyConsumptionGraphContractNonzeroResponse;
    default:
      return undefined;
  }
}

export const energyConsumptionGraphTestCases: EnergyConsumptionGraphTestCase[] =
  [
    {
      testName:
        "Consumption chart — daily usage for the consumer",
      scenario: "ecg_by_ivrs_daily",
      tags: ["@smoke", "@consumer", "@energy-consumption-graph"],
    },
    {
      testName:
        "Consumption chart — last few hours",
      scenario: "ecg_period_hourly",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — weekly view",
      scenario: "ecg_period_weekly",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — monthly view",
      scenario: "ecg_period_monthly",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — yearly view",
      scenario: "ecg_period_yearly",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — opens using the account number",
      scenario: "ecg_by_account",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — opens using the meter",
      scenario: "ecg_by_meter",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — extra unused options are ignored",
      scenario: "ecg_ignore_unknown_query",
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — sample: hourly usage",
      scenario: "contract_hourly",
      isContractFixture: true,
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — sample: daily usage",
      scenario: "contract_daily",
      isContractFixture: true,
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — sample: weekly usage",
      scenario: "contract_weekly",
      isContractFixture: true,
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — sample: monthly usage",
      scenario: "contract_monthly",
      isContractFixture: true,
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — sample: yearly usage",
      scenario: "contract_yearly",
      isContractFixture: true,
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — sample: days with usage",
      scenario: "contract_nonzero_consumption",
      isContractFixture: true,
      tags: ["@consumer", "@energy-consumption-graph", "@edge"],
    },
    {
      testName:
        "Consumption chart — unknown consumer is not found",
      scenario: "consumer_not_found",
      expectedStatus: 404,
      tags: ["@consumer", "@energy-consumption-graph", "@negative"],
    },
    {
      testName:
        "Consumption chart — unknown meter is empty or not found",
      scenario: "meter_not_found",
      tags: ["@consumer", "@energy-consumption-graph", "@negative"],
    },
    {
      testName:
        "Consumption chart — blank consumer number is rejected",
      scenario: "empty_consumer_ref",
      expectedStatus: 400,
      tags: ["@consumer", "@energy-consumption-graph", "@negative"],
    },
    {
      testName:
        "Consumption chart — invalid time range is rejected",
      scenario: "invalid_period",
      expectedStatus: 400,
      tags: ["@consumer", "@energy-consumption-graph", "@negative"],
    },
  ];
