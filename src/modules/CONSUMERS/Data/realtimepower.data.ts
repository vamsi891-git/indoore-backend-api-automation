import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { RealTimePowerQuery } from "../Api/realtimepower.api";
import type {
  RealTimePowerResponse,
  RealTimePowerScenario,
} from "../Mapper/realtimepower.mapper";

export const realTimePowerMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** IVRS that resolves a live consumer (3PH WC). Live data may be null or phases. */
export const realTimePowerDefaultIvrs = "N3472029226";

/** Account / unique id (same consumer when uniqueId equals IVRS). */
export const realTimePowerDefaultConsumerId = "N3472029226";

export const realTimePowerDefaultMeterRoute = "meter-12345";

export const realTimePowerNotFoundRef = "INVALID_CONSUMER_XYZ";

export const realTimePowerMeterNotFoundRef = "meter-999999999";

export const realTimePowerEmptyRef = " ";

/** Shape A — consumer found, no instantaneous IP reading. */
export const realTimePowerContractNullResponse: RealTimePowerResponse = {
  success: true,
  data: null,
};

/** Shape B — TP sample (user/backend contract). */
export const realTimePowerContractTpResponse: RealTimePowerResponse = {
  success: true,
  data: {
    "R-Phase": {
      voltage: 230.5,
      voltageUnit: "Volts",
      current: 12.4,
      currentUnit: "Amps",
      powerFactor: 0.98,
      powerFactorUnit: "Power Factor",
    },
    "Y-Phase": {
      voltage: 231.1,
      voltageUnit: "Volts",
      current: 11.9,
      currentUnit: "Amps",
      powerFactor: 0.97,
      powerFactorUnit: "Power Factor",
    },
    "B-Phase": {
      voltage: 229.8,
      voltageUnit: "Volts",
      current: 12.1,
      currentUnit: "Amps",
      powerFactor: 0.99,
      powerFactorUnit: "Power Factor",
    },
  },
};

/** SP backend map: R populated, Y/B null. */
export const realTimePowerContractSpResponse: RealTimePowerResponse = {
  success: true,
  data: {
    "R-Phase": {
      voltage: 230.5,
      voltageUnit: "Volts",
      current: 5.2,
      currentUnit: "Amps",
      powerFactor: 0.95,
      powerFactorUnit: "Power Factor",
    },
    "Y-Phase": null,
    "B-Phase": null,
  },
};

export interface RealTimePowerTestCase {
  testName: string;
  scenario: RealTimePowerScenario;
  expectedStatus?: number;
  /** Skip live HTTP; validate mapper/validator against fixture body. */
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveRealTimePowerRef(
  scenario: RealTimePowerScenario,
): string | undefined {
  switch (scenario) {
    case "power_by_ivrs":
    case "power_ignore_unknown_query":
      return (
        process.env.CONSUMER_RTP_IVRS?.trim() ||
        process.env.CONSUMER_PROFILE_IVRS?.trim() ||
        realTimePowerDefaultIvrs
      );
    case "power_by_account":
      return (
        process.env.CONSUMER_RTP_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_PROFILE_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_ACTIVATION_CONSUMER_ID?.trim() ||
        realTimePowerDefaultConsumerId
      );
    case "power_by_meter":
      return (
        process.env.CONSUMER_RTP_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        realTimePowerDefaultMeterRoute
      );
    case "consumer_not_found":
      return realTimePowerNotFoundRef;
    case "meter_not_found":
      return realTimePowerMeterNotFoundRef;
    case "empty_consumer_ref":
      return realTimePowerEmptyRef;
    case "contract_null_data":
    case "contract_tp_phases":
    case "contract_sp_phases":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveRealTimePowerQuery(
  scenario: RealTimePowerScenario,
): RealTimePowerQuery {
  if (scenario === "power_ignore_unknown_query") {
    return { foo: 1 };
  }
  return {};
}

export function resolveRealTimePowerContractBody(
  scenario: RealTimePowerScenario,
): RealTimePowerResponse | undefined {
  switch (scenario) {
    case "contract_null_data":
      return realTimePowerContractNullResponse;
    case "contract_tp_phases":
      return realTimePowerContractTpResponse;
    case "contract_sp_phases":
      return realTimePowerContractSpResponse;
    default:
      return undefined;
  }
}

export const realTimePowerTestCases: RealTimePowerTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/real-time-power — success with data null or R/Y/B phases",
    scenario: "power_by_ivrs",
    tags: ["@smoke", "@consumer", "@real-time-power"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/real-time-power — resolve by account id",
    scenario: "power_by_account",
    tags: ["@consumer", "@real-time-power", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/real-time-power — resolve by meter lookup id",
    scenario: "power_by_meter",
    tags: ["@consumer", "@real-time-power", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/real-time-power — unknown query params ignored",
    scenario: "power_ignore_unknown_query",
    tags: ["@consumer", "@real-time-power", "@edge"],
  },
  {
    testName:
      "Contract — Shape A success envelope with data null (no live IP row)",
    scenario: "contract_null_data",
    isContractFixture: true,
    tags: ["@consumer", "@real-time-power", "@edge"],
  },
  {
    testName:
      "Contract — Shape B TP populated R/Y/B phases (sample + backend mapTp)",
    scenario: "contract_tp_phases",
    isContractFixture: true,
    tags: ["@consumer", "@real-time-power", "@edge"],
  },
  {
    testName:
      "Contract — SP map: R-Phase populated, Y/B null (backend mapSp)",
    scenario: "contract_sp_phases",
    isContractFixture: true,
    tags: ["@consumer", "@real-time-power", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/real-time-power — consumer not found",
    scenario: "consumer_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@real-time-power", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/real-time-power — unknown meter lookup not found",
    scenario: "meter_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@real-time-power", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/real-time-power — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@real-time-power", "@negative"],
  },
];
