import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ValidateAddMeterScenario } from "../Mapper/validate-add-meter.mapper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export const validateAddMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live exact copy for duplicate serials. */
export const VALIDATE_ADD_METER_ALREADY_EXISTS_MESSAGE = "Meter serial number already exists";

export interface ValidateAddMeterTestCase {
  testName: string;
  scenario: ValidateAddMeterScenario;
  envKey?: ValidateAddMeterRuntimeEnvKey;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export type ValidateAddMeterRuntimeEnvKey =
  | "VALIDATE_ADD_METER_VALID_SERIAL"
  | "VALIDATE_ADD_METER_EXISTS_SERIAL";

/**
 * Prefer runtime-verified serials from `ensureValidateMeterRuntimeContext`
 * (avoids truncated random collisions and stale env values).
 */
export function resolveValidateAddMeterSerial(scenario: ValidateAddMeterScenario): string {
  if (scenario === "valid_new") {
    return getValidateMeterSerial("VALIDATE_ADD_METER_VALID_SERIAL");
  }
  if (scenario === "already_exists") {
    return getValidateMeterSerial("VALIDATE_ADD_METER_EXISTS_SERIAL");
  }
  return "";
}

export const validateAddMeterTestCases: ValidateAddMeterTestCase[] = [
  {
    testName: "Can this meter serial be added? — a new serial is allowed",
    scenario: "valid_new",
    envKey: "VALIDATE_ADD_METER_VALID_SERIAL",
    tags: ["@smoke", "@master-data", "@validate-add-meter", "@meter-master"],
    nonEmptyExpected: true,
  },
  {
    testName: "Can this meter serial be added? — a serial that already exists is rejected",
    scenario: "already_exists",
    envKey: "VALIDATE_ADD_METER_EXISTS_SERIAL",
    tags: ["@master-data", "@validate-add-meter", "@negative"],
    nonEmptyExpected: false,
  },
];

export const validateAddMeterNegativeCases = [
  {
    testName: "Can this meter serial be added? — an empty serial is rejected",
    meterSerialNumber: "",
    tags: ["@master-data", "@validate-add-meter", "@negative", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Can this meter serial be added? — a serial that is only spaces is rejected",
    meterSerialNumber: "   ",
    tags: ["@master-data", "@validate-add-meter", "@negative", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Can this meter serial be added? — the check is rejected when no serial is entered",
    meterSerialNumber: null as string | null,
    tags: ["@master-data", "@validate-add-meter", "@negative", "@edge"],
    nonEmptyExpected: false,
  },
] as const;
