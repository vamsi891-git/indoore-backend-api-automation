import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ValidateAddMeterScenario } from "../Mapper/validate-add-meter.mapper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export const validateAddMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface ValidateAddMeterTestCase {
  testName: string;
  scenario: ValidateAddMeterScenario;
  envKey: ValidateAddMeterRuntimeEnvKey;
  tags: string[];
}

export type ValidateAddMeterRuntimeEnvKey =
  | "VALIDATE_ADD_METER_VALID_SERIAL"
  | "VALIDATE_ADD_METER_EXISTS_SERIAL";

export function resolveValidateAddMeterSerial(
  scenario: ValidateAddMeterScenario,
): string {
  if (scenario === "valid_new") {
    return getValidateMeterSerial("VALIDATE_ADD_METER_VALID_SERIAL");
  }
  return getValidateMeterSerial("VALIDATE_ADD_METER_EXISTS_SERIAL");
}

export const validateAddMeterTestCases: ValidateAddMeterTestCase[] = [
  {
    testName:
      "Validate GET /indore/master-data/validate-add-meter — new meter serial allowed",
    scenario: "valid_new",
    envKey: "VALIDATE_ADD_METER_VALID_SERIAL",
    tags: ["@smoke", "@master-data", "@validate-add-meter", "@meter-master"],
  },
  {
    testName: "Validate meter serial already exists — METER_ALREADY_EXISTS",
    scenario: "already_exists",
    envKey: "VALIDATE_ADD_METER_EXISTS_SERIAL",
    tags: ["@master-data", "@validate-add-meter", "@negative"],
  },
];
