import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerActivationStatus } from "../Mapper/activation.mapper";
import type { ActivationScenario } from "../Mapper/activation.mapper";

export const activationMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const activationDefaultConsumerId = "5633025000";

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
}

export function resolveActivationConsumerId(
  scenario: ActivationScenario,
): string | undefined {
  switch (scenario) {
    case "activate":
    case "deactivate":
    case "activate_idempotent":
    case "invalid_status":
    case "empty_status":
    case "missing_status":
      return (
        process.env.CONSUMER_ACTIVATION_CONSUMER_ID?.trim() ||
        activationDefaultConsumerId
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
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — activate consumer",
    scenario: "activate",
    requestStatus: "active",
    tags: ["@smoke", "@consumer", "@activation"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — deactivate consumer",
    scenario: "deactivate",
    requestStatus: "inactive",
    restoreStatus: "active",
    tags: ["@consumer", "@activation", "@edge"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — idempotent activate when already active",
    scenario: "activate_idempotent",
    requestStatus: "active",
    tags: ["@consumer", "@activation", "@edge"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — consumer not found",
    scenario: "consumer_not_found",
    requestStatus: "active",
    expectedStatus: 404,
    tags: ["@consumer", "@activation", "@negative"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — meter route rejected",
    scenario: "meter_route_rejected",
    requestStatus: "active",
    expectedStatus: 404,
    tags: ["@consumer", "@activation", "@negative"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — invalid status enum",
    scenario: "invalid_status",
    invalidStatus: "invalid",
    expectedStatus: 400,
    tags: ["@consumer", "@activation", "@negative"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — empty status rejected",
    scenario: "empty_status",
    invalidStatus: "",
    expectedStatus: 400,
    tags: ["@consumer", "@activation", "@negative"],
  },
  {
    testName:
      "Validate PATCH /indore/consumers/{consumerId}/activation — missing status required",
    scenario: "missing_status",
    expectedStatus: 400,
    tags: ["@consumer", "@activation", "@negative"],
  },
];
