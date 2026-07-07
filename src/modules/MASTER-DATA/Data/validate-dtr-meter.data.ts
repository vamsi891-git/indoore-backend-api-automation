import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ValidateDtrMeterScenario } from "../Mapper/validate-dtr-meter.mapper";

export const validateDtrMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const validateDtrMeterNotFoundSerial = "MSN_INVALID_NONEXISTENT_00000";

export interface ValidateDtrMeterTestCase {
  testName: string;
  scenario: ValidateDtrMeterScenario;
  envKey?: string;
  tags: string[];
}

export const validateDtrMeterTestCases: ValidateDtrMeterTestCase[] = [
  {
    testName:
      "Validate GET /indore/master-data/validate-dtr-meter — assignable active meter",
    scenario: "valid_unmapped",
    envKey: "VALIDATE_DTR_METER_VALID_SERIAL",
    tags: ["@smoke", "@master-data", "@validate-dtr-meter", "@dtr-master"],
  },
  {
    testName: "Validate meter serial does not exist — meterExists false",
    scenario: "not_found",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
  {
    testName: "Validate already mapped to another DTR",
    scenario: "already_on_dtrs",
    envKey: "VALIDATE_DTR_METER_ON_DTR_SERIAL",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
  {
    testName: "Validate inactive meter",
    scenario: "inactive",
    envKey: "VALIDATE_DTR_METER_INACTIVE_SERIAL",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
  {
    testName: "Validate already assigned to consumer",
    scenario: "already_assigned",
    envKey: "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
];
