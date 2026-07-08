import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ValidateMeterScenario } from "../Mapper/validatemeter.mapper";
import { getValidateConsumerMeterSerial } from "../utils/validate-consumer-meter-runtime.helper";

export const validateMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const validateMeterNotInSystemSerial = "891901";

export type ValidateConsumerMeterRuntimeEnvKey =
  | "VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL"
  | "VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL"
  | "VALIDATE_CONSUMER_METER_INACTIVE_SERIAL"
  | "VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL";

export interface ValidateMeterTestCase {
  testName: string;
  scenario: ValidateMeterScenario;
  expectedStatus?: number;
  envKey?: ValidateConsumerMeterRuntimeEnvKey;
  includeOrganisationLookupId?: boolean;
  tags: string[];
}

export function resolveValidateConsumerMeterSerial(
  scenario: ValidateMeterScenario,
): string {
  if (scenario === "missing_meter_serial" || scenario === "empty_meter_serial") {
    return "";
  }
  return getValidateConsumerMeterSerial(scenario, validateMeterNotInSystemSerial);
}

export const validateMeterTestCases: ValidateMeterTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/validate-meter — assignable active meter",
    scenario: "assignable",
    envKey: "VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL",
    tags: ["@smoke", "@consumer", "@validate-meter"],
  },
  {
    testName:
      "Validate meter serial not in system — valid true and meterExists false",
    scenario: "meter_not_in_system",
    envKey: "VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Validate meter already assigned to consumer — METER_ALREADY_ASSIGNED",
    scenario: "already_assigned",
    envKey: "VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName: "Validate inactive meter — METER_INACTIVE",
    scenario: "inactive",
    envKey: "VALIDATE_CONSUMER_METER_INACTIVE_SERIAL",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/validate-meter — optional organisationLookupId",
    scenario: "assignable",
    envKey: "VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL",
    includeOrganisationLookupId: true,
    tags: ["@consumer", "@validate-meter", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/validate-meter — meterSerialNumber required",
    scenario: "missing_meter_serial",
    expectedStatus: 400,
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/validate-meter — empty meterSerialNumber rejected",
    scenario: "empty_meter_serial",
    expectedStatus: 400,
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
];
