import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { LiveLoadProfileQuery } from "../Api/liveloadprofile.api";
import type {
  LiveLoadProfileResponse,
  LiveLoadProfileScenario,
} from "../Mapper/liveloadprofile.mapper";
import {
  CONSUMERS_LIVE_IVRS,
  CONSUMERS_LIVE_METER_ROUTE,
  resolveLiveAccountId,
  resolveLiveIvrs,
  resolveLiveMeterRoute,
} from "./consumers-live-refs";
export const liveLoadProfileMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** IVRS from live RTP/PQ sample. Live data may be null when no recent IP row. */
export const liveLoadProfileDefaultIvrs = CONSUMERS_LIVE_IVRS;
export const liveLoadProfileDefaultConsumerId = CONSUMERS_LIVE_IVRS;
export const liveLoadProfileDefaultMeterRoute = CONSUMERS_LIVE_METER_ROUTE;
export const liveLoadProfileNotFoundRef = "INVALID_CONSUMER_XYZ";
export const liveLoadProfileMeterNotFoundRef = "meter-999999999";
export const liveLoadProfileEmptyRef = " ";
/** Shape A — consumer found, no instantaneous IP reading. */
export const liveLoadProfileContractNullResponse: LiveLoadProfileResponse = {
  success: true,
  data: null,
};
/**
 * Shape B — populated TP sample (user-provided).
 * Backend toLiveLoadProfile(): total = |kW|+|kVA|+|kvar|; percent one decimal.
 */
export const liveLoadProfileContractTpResponse: LiveLoadProfileResponse = {
  success: true,
  data: {
    lastReadingIso: "2026-05-19T08:30:00.000Z",
    meterPhase: "TP",
    total: 16.4,
    metrics: [
      { title: "Active Power", value: 8, percent: 48.8 },
      { title: "Apparent Power", value: 8, percent: 48.8 },
      { title: "Reactive Power", value: 0.4, percent: 2.4 },
    ],
  },
};
/**
 * Shape C — SP sample with reactive derived from sqrt(kVA² − kW²).
 * kW=6, kVA=10 → kvar=8; total=24; percents 25.0 / 41.7 / 33.3.
 */
export const liveLoadProfileContractSpResponse: LiveLoadProfileResponse = {
  success: true,
  data: {
    lastReadingIso: "2026-06-10T12:15:00.000Z",
    meterPhase: "SP",
    total: 24,
    metrics: [
      { title: "Active Power", value: 6, percent: 25 },
      { title: "Apparent Power", value: 10, percent: 41.7 },
      { title: "Reactive Power", value: 8, percent: 33.3 },
    ],
  },
};
export interface LiveLoadProfileTestCase {
  testName: string;
  scenario: LiveLoadProfileScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}
export function resolveLiveLoadProfileRef(scenario: LiveLoadProfileScenario): string | undefined {
  switch (scenario) {
    case "llp_by_ivrs":
    case "llp_ignore_unknown_query":
      return resolveLiveIvrs(
        process.env.CONSUMER_LLP_IVRS,
        process.env.CONSUMER_PQ_IVRS,
        process.env.CONSUMER_RTP_IVRS,
        liveLoadProfileDefaultIvrs,
      );
    case "llp_by_account":
      return resolveLiveAccountId(
        process.env.CONSUMER_LLP_CONSUMER_ID,
        process.env.CONSUMER_PQ_CONSUMER_ID,
        process.env.CONSUMER_RTP_CONSUMER_ID,
        liveLoadProfileDefaultConsumerId,
      );
    case "llp_by_meter":
      return resolveLiveMeterRoute(
        process.env.CONSUMER_LLP_METER_ROUTE,
        process.env.CONSUMER_PQ_METER_ROUTE,
        process.env.CONSUMER_RTP_METER_ROUTE,
        process.env.CONSUMER_PROFILE_METER_ROUTE,
        liveLoadProfileDefaultMeterRoute,
      );
    case "consumer_not_found":
      return liveLoadProfileNotFoundRef;
    case "meter_not_found":
      return liveLoadProfileMeterNotFoundRef;
    case "empty_consumer_ref":
      return liveLoadProfileEmptyRef;
    case "contract_null_data":
    case "contract_tp_metrics":
    case "contract_sp_metrics":
      return undefined;
    default:
      return undefined;
  }
}
export function resolveLiveLoadProfileQuery(
  scenario: LiveLoadProfileScenario,
): LiveLoadProfileQuery {
  if (scenario === "llp_ignore_unknown_query") {
    return { foo: 1 };
  }
  return {};
}
export function resolveLiveLoadProfileContractBody(
  scenario: LiveLoadProfileScenario,
): LiveLoadProfileResponse | undefined {
  switch (scenario) {
    case "contract_null_data":
      return liveLoadProfileContractNullResponse;
    case "contract_tp_metrics":
      return liveLoadProfileContractTpResponse;
    case "contract_sp_metrics":
      return liveLoadProfileContractSpResponse;
    default:
      return undefined;
  }
}
export const liveLoadProfileTestCases: LiveLoadProfileTestCase[] = [
  {
    testName: "Live load — current load for the consumer",
    scenario: "llp_by_ivrs",
    tags: ["@smoke", "@consumer", "@live-load-profile"],
    nonEmptyExpected: true,
  },
  {
    testName: "Live load — opens using the account number",
    scenario: "llp_by_account",
    tags: ["@consumer", "@live-load-profile", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — opens using the meter",
    scenario: "llp_by_meter",
    tags: ["@consumer", "@live-load-profile", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — extra unused options are ignored",
    scenario: "llp_ignore_unknown_query",
    tags: ["@consumer", "@live-load-profile", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — sample: no live reading yet",
    scenario: "contract_null_data",
    isContractFixture: true,
    tags: ["@consumer", "@live-load-profile", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — sample: three-phase load",
    scenario: "contract_tp_metrics",
    isContractFixture: true,
    tags: ["@consumer", "@live-load-profile", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — sample: single-phase load",
    scenario: "contract_sp_metrics",
    isContractFixture: true,
    tags: ["@consumer", "@live-load-profile", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — unknown consumer is not found",
    scenario: "consumer_not_found",
    expectedStatus: 200,
    tags: ["@consumer", "@live-load-profile", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — unknown meter is empty or not found",
    scenario: "meter_not_found",
    tags: ["@consumer", "@live-load-profile", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Live load — blank consumer number is rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@live-load-profile", "@negative"],
    nonEmptyExpected: false,
  },
];
