import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { PowerQualityQuery } from "../Api/powerquality.api";
import type {PowerQualityResponse,PowerQualityScenario,} from "../Mapper/powerquality.mapper";
import {
  CONSUMERS_LIVE_ACCOUNT_ID,
  CONSUMERS_LIVE_IVRS,
  CONSUMERS_LIVE_METER_ROUTE,
  resolveLiveAccountId,
  resolveLiveIvrs,
  resolveLiveMeterRoute,
} from "./consumers-live-refs";
export const powerQualityMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** IVRS with live power-quality metrics (PF/Hz/MD). Same meter as RTP. */
export const powerQualityDefaultIvrs = CONSUMERS_LIVE_IVRS;
export const powerQualityDefaultConsumerId = CONSUMERS_LIVE_ACCOUNT_ID;
export const powerQualityDefaultMeterRoute = CONSUMERS_LIVE_METER_ROUTE;
export const powerQualityNotFoundRef = "INVALID_CONSUMER_XYZ";
export const powerQualityMeterNotFoundRef = "meter-999999999";
export const powerQualityEmptyRef = " ";
/** Shape A — consumer found, no instantaneous IP reading. */
export const powerQualityContractNullResponse: PowerQualityResponse = {
  success: true,
  data: null,
};
/**
 * Shape B — populated SP sample (user-provided).
 * Backend SP maps Neutral_Current; units/titles from toPowerQuality().
 */
export const powerQualityContractSpResponse: PowerQualityResponse = {
  success: true,
  data: {
    overallPf: {
      title: "Overall PF",
      value: 0.96,
      unit: "Power Factor",
      subtitle: "System PF",
    },
    frequency: {
      title: "Frequency",
      value: 50.02,
      unit: "Hz",
      subtitle: "Frequency",
    },
    neutralCurrent: {
      title: "Neutral Current",
      value: 0.8,
      unit: "Amps",
      subtitle: "Neutral Load",
    },
    mdKw: {
      title: "MD kW",
      value: 45.2,
      unit: "kW",
      subtitle: "5 Jun 2026, 2:30 pm",
    },
    mdKva: {
      title: "MD kVA",
      value: 48.1,
      unit: "kVA",
      subtitle: "5 Jun 2026, 2:30 pm",
    },
  },
};
/** TP map: neutralCurrent.value is always null (backend hardcodes null). */
export const powerQualityContractTpResponse: PowerQualityResponse = {
  success: true,
  data: {
    overallPf: {
      title: "Overall PF",
      value: 0.98,
      unit: "Power Factor",
      subtitle: "System PF",
    },
    frequency: {
      title: "Frequency",
      value: 50.0,
      unit: "Hz",
      subtitle: "Frequency",
    },
    neutralCurrent: {
      title: "Neutral Current",
      value: null,
      unit: "Amps",
      subtitle: "Neutral Load",
    },
    mdKw: {
      title: "MD kW",
      value: 12.5,
      unit: "kW",
      subtitle: null,
    },
    mdKva: {
      title: "MD kVA",
      value: 13.1,
      unit: "kVA",
      subtitle: null,
    },
  },
};
export interface PowerQualityTestCase {
  testName: string;
  scenario: PowerQualityScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}
export function resolvePowerQualityRef(
  scenario: PowerQualityScenario,
): string | undefined {
  switch (scenario) {
    case "pq_by_ivrs":
    case "pq_ignore_unknown_query":
      return resolveLiveIvrs(
        process.env.CONSUMER_PQ_IVRS,
        process.env.CONSUMER_RTP_IVRS,
        powerQualityDefaultIvrs,
      );
    case "pq_by_account":
      return resolveLiveAccountId(
        process.env.CONSUMER_PQ_CONSUMER_ID,
        process.env.CONSUMER_RTP_CONSUMER_ID,
        powerQualityDefaultConsumerId,
      );
    case "pq_by_meter":
      return resolveLiveMeterRoute(
        process.env.CONSUMER_PQ_METER_ROUTE,
        process.env.CONSUMER_RTP_METER_ROUTE,
        process.env.CONSUMER_PROFILE_METER_ROUTE,
        powerQualityDefaultMeterRoute,
      );
    case "consumer_not_found":
      return powerQualityNotFoundRef;
    case "meter_not_found":
      return powerQualityMeterNotFoundRef;
    case "empty_consumer_ref":
      return powerQualityEmptyRef;
    case "contract_null_data":
    case "contract_sp_metrics":
    case "contract_tp_metrics":
      return undefined;
    default:
      return undefined;
  }
}
export function resolvePowerQualityQuery(
  scenario: PowerQualityScenario,
): PowerQualityQuery {
  if (scenario === "pq_ignore_unknown_query") {
    return { foo: 1 };
  }
  return {};
}
export function resolvePowerQualityContractBody(
  scenario: PowerQualityScenario,
): PowerQualityResponse | undefined {
  switch (scenario) {
    case "contract_null_data":
      return powerQualityContractNullResponse;
    case "contract_sp_metrics":
      return powerQualityContractSpResponse;
    case "contract_tp_metrics":
      return powerQualityContractTpResponse;
    default:
      return undefined;
  }
}
export const powerQualityTestCases: PowerQualityTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/power-quality — success with data null or metrics",
    scenario: "pq_by_ivrs",
    tags: ["@smoke", "@consumer", "@power-quality"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/power-quality — resolve by account id",
    scenario: "pq_by_account",
    tags: ["@consumer", "@power-quality", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/power-quality — resolve by meter lookup id",
    scenario: "pq_by_meter",
    tags: ["@consumer", "@power-quality", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/power-quality — unknown query params ignored",
    scenario: "pq_ignore_unknown_query",
    tags: ["@consumer", "@power-quality", "@edge"],
  },
  {
    testName:
      "Contract — Shape A success envelope with data null (no live IP row)",
    scenario: "contract_null_data",
    isContractFixture: true,
    tags: ["@consumer", "@power-quality", "@edge"],
  },
  {
    testName:
      "Contract — Shape B SP metrics (PF/Hz/neutral/MD) from backend toPowerQuality",
    scenario: "contract_sp_metrics",
    isContractFixture: true,
    tags: ["@consumer", "@power-quality", "@edge"],
  },
  {
    testName:
      "Contract — TP metrics: neutralCurrent value null (backend TP hardcode)",
    scenario: "contract_tp_metrics",
    isContractFixture: true,
    tags: ["@consumer", "@power-quality", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/power-quality — consumer not found",
    scenario: "consumer_not_found",
    expectedStatus: 200,
    tags: ["@consumer", "@power-quality", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/power-quality — unknown meter not found or null data",
    scenario: "meter_not_found",
    tags: ["@consumer", "@power-quality", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/power-quality — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@power-quality", "@negative"],
  },
];
