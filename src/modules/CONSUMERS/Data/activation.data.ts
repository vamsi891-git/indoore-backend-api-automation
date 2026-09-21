import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerActivationStatus } from "../Mapper/activation.mapper";
import type { ActivationScenario } from "../Mapper/activation.mapper";
import { CONSUMERS_LIVE_ACCOUNT_ID, resolveLiveAccountId } from "./consumers-live-refs";
export const activationMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
export const activationDefaultConsumerId = CONSUMERS_LIVE_ACCOUNT_ID;
export const activationNotFoundConsumerId = "INVALID_CONSUMER_XYZ";
export const activationMeterRouteConsumerId = "meter-12345";
export interface ActivationTestCase {
  testName: string;
  scenario: ActivationScenario;
  expectedStatus?: number;
  consumerId?: string;
  requestStatus?: ConsumerActivationStatus;
  invalidStatus?: string;
  restoreStatus?: ConsumerActivationStatus;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveActivationConsumerId(scenario: ActivationScenario): string | undefined {
  switch (scenario) {
    case "activate":
    case "deactivate":
    case "activate_idempotent":
    case "invalid_status":
    case "empty_status":
    case "missing_status":
      return resolveLiveAccountId(
        process.env.CONSUMER_ACTIVATION_CONSUMER_ID,
        activationDefaultConsumerId,
      );
    case "consumer_not_found":
      return activationNotFoundConsumerId;
    case "meter_route_rejected":
      return activationMeterRouteConsumerId;
    default:
      return undefined;
  }
}

export const activationTestCases: ActivationTestCase[] = [
  {
    testName: "Turn consumer on — active status is saved",
    scenario: "activate",
    requestStatus: "active",
    tags: ["@smoke", "@consumer", "@activation"],
    nonEmptyExpected: true,
  },
  {
    testName: "Turn consumer off — inactive status is saved",
    scenario: "deactivate",
    requestStatus: "inactive",
    restoreStatus: "active",
    tags: ["@consumer", "@activation", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Turn consumer on — already active stays active",
    scenario: "activate_idempotent",
    requestStatus: "active",
    tags: ["@consumer", "@activation", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Turn consumer on or off — unknown consumer is not found",
    scenario: "consumer_not_found",
    requestStatus: "active",
    expectedStatus: 404,
    tags: ["@consumer", "@activation", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Turn consumer on or off — cannot use a meter number here",
    scenario: "meter_route_rejected",
    requestStatus: "active",
    expectedStatus: 404,
    tags: ["@consumer", "@activation", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Turn consumer on or off — invalid status is rejected",
    scenario: "invalid_status",
    invalidStatus: "invalid",
    expectedStatus: 400,
    tags: ["@consumer", "@activation", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Turn consumer on or off — empty status is rejected",
    scenario: "empty_status",
    invalidStatus: "",
    expectedStatus: 400,
    tags: ["@consumer", "@activation", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Turn consumer on or off — status is required",
    scenario: "missing_status",
    expectedStatus: 400,
    tags: ["@consumer", "@activation", "@negative"],
    nonEmptyExpected: false,
  },
];
