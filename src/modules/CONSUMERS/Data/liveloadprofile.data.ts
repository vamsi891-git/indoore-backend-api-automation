import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { LiveLoadProfileQuery } from "../Api/liveloadprofile.api";
import type {
  LiveLoadProfileResponse,
  LiveLoadProfileScenario,
} from "../Mapper/liveloadprofile.mapper";

export const liveLoadProfileMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** IVRS from user request (TP sample). Live data may be null when no recent IP row. */
export const liveLoadProfileDefaultIvrs = "N3374018980";

export const liveLoadProfileDefaultConsumerId = "N3374018980";

export const liveLoadProfileDefaultMeterRoute = "meter-12345";

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
}

export function resolveLiveLoadProfileRef(
  scenario: LiveLoadProfileScenario,
): string | undefined {
  switch (scenario) {
    case "llp_by_ivrs":
    case "llp_ignore_unknown_query":
      return (
        process.env.CONSUMER_LLP_IVRS?.trim() ||
        process.env.CONSUMER_PQ_IVRS?.trim() ||
        process.env.CONSUMER_RTP_IVRS?.trim() ||
        liveLoadProfileDefaultIvrs
      );
    case "llp_by_account":
      return (
        process.env.CONSUMER_LLP_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_PQ_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_RTP_CONSUMER_ID?.trim() ||
        liveLoadProfileDefaultConsumerId
      );
    case "llp_by_meter":
      return (
        process.env.CONSUMER_LLP_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PQ_METER_ROUTE?.trim() ||
        process.env.CONSUMER_RTP_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        liveLoadProfileDefaultMeterRoute
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
    testName:
      "Validate GET /indore/consumers/{ivrs}/live-load-profile — success with data null or metrics",
    scenario: "llp_by_ivrs",
    tags: ["@smoke", "@consumer", "@live-load-profile"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/live-load-profile — resolve by account id",
    scenario: "llp_by_account",
    tags: ["@consumer", "@live-load-profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/live-load-profile — resolve by meter lookup id",
    scenario: "llp_by_meter",
    tags: ["@consumer", "@live-load-profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/live-load-profile — unknown query params ignored",
    scenario: "llp_ignore_unknown_query",
    tags: ["@consumer", "@live-load-profile", "@edge"],
  },
  {
    testName:
      "Contract — Shape A success envelope with data null (no live IP row)",
    scenario: "contract_null_data",
    isContractFixture: true,
    tags: ["@consumer", "@live-load-profile", "@edge"],
  },
  {
    testName:
      "Contract — Shape B TP metrics (kW/kVA/kvar shares) from backend toLiveLoadProfile",
    scenario: "contract_tp_metrics",
    isContractFixture: true,
    tags: ["@consumer", "@live-load-profile", "@edge"],
  },
  {
    testName:
      "Contract — Shape C SP metrics with reactive derived from sqrt(kVA² − kW²)",
    scenario: "contract_sp_metrics",
    isContractFixture: true,
    tags: ["@consumer", "@live-load-profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/live-load-profile — consumer not found",
    scenario: "consumer_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@live-load-profile", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/live-load-profile — unknown meter not found or null data",
    scenario: "meter_not_found",
    tags: ["@consumer", "@live-load-profile", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/live-load-profile — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@live-load-profile", "@negative"],
  },
];
