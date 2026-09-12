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
    testName: "Can this meter be put on a DTR? — an unused active meter can be put on a DTR",
    scenario: "valid_unmapped",
    envKey: "VALIDATE_DTR_METER_VALID_SERIAL",
    tags: ["@smoke", "@master-data", "@validate-dtr-meter", "@dtr-master"],
  },
  {
    testName: "Can this meter be put on a DTR? — an unknown serial is reported as not found",
    scenario: "not_found",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
  {
    testName: "Can this meter be put on a DTR? — a meter that is already on a DTR is rejected",
    scenario: "already_on_dtrs",
    envKey: "VALIDATE_DTR_METER_ON_DTR_SERIAL",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
  {
    testName: "Can this meter be put on a DTR? — an inactive meter is rejected",
    scenario: "inactive",
    envKey: "VALIDATE_DTR_METER_INACTIVE_SERIAL",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
  {
    testName: "Can this meter be put on a DTR? — a meter that is already on a consumer is rejected",
    scenario: "already_assigned",
    envKey: "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
    tags: ["@master-data", "@validate-dtr-meter", "@negative"],
  },
];
