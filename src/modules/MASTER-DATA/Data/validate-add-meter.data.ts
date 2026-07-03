import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ValidateAddMeterScenario } from "../Mapper/validate-add-meter.mapper";

export const validateAddMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface ValidateAddMeterTestCase {
  testName: string;
  meterSerialNumber: string;
  scenario: ValidateAddMeterScenario;
  envKey: string;
  tags: string[];
}

function envSerial(key: string): string {
  return process.env[key]?.trim() ?? "";
}

export const validateAddMeterTestCases: ValidateAddMeterTestCase[] = [
  {
    testName:
      "Validate GET /indore/master-data/validate-add-meter — new meter serial allowed",
    meterSerialNumber: envSerial("VALIDATE_ADD_METER_VALID_SERIAL"),
    scenario: "valid_new",
    envKey: "VALIDATE_ADD_METER_VALID_SERIAL",
    tags: ["@smoke", "@master-data", "@validate-add-meter", "@meter-master"],
  },
  {
    testName: "Validate meter serial already exists — METER_ALREADY_EXISTS",
    meterSerialNumber: envSerial("VALIDATE_ADD_METER_EXISTS_SERIAL"),
    scenario: "already_exists",
    envKey: "VALIDATE_ADD_METER_EXISTS_SERIAL",
    tags: ["@master-data", "@validate-add-meter", "@negative"],
  },
];
