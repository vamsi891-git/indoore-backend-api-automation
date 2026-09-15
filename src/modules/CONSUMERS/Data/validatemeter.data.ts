import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ValidateMeterScenario } from "../Mapper/validatemeter.mapper";
import { getValidateConsumerMeterSerial } from "../utils/validate-consumer-meter-runtime.helper";

export const validateMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
export const validateMeterNotInSystemSerial = "891901";
export const validateMeterForeignOrganisationLookupId = 999_999_999;

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
  extraParams?: Record<string, string | number>;
  padSerial?: boolean;
  duplicateGet?: boolean;
  errorField?: string;
  tags: string[];
}

const SERIAL_SCENARIOS: ValidateMeterScenario[] = [
  "assignable",
  "meter_not_in_system",
  "already_assigned",
  "inactive",
];

/** Prefer a live assigned serial so org/edge cases run without creating meters. */
export function resolveKnownValidateMeterSerial(): string {
  return (
    getValidateConsumerMeterSerial("already_assigned", "") ||
    getValidateConsumerMeterSerial("assignable", "") ||
    getValidateConsumerMeterSerial("inactive", "") ||
    getValidateConsumerMeterSerial(
      "meter_not_in_system",
      validateMeterNotInSystemSerial,
    )
  );
}

export function resolveValidateConsumerMeterSerial(
  scenario: ValidateMeterScenario,
): string {
  if (SERIAL_SCENARIOS.includes(scenario)) {
    return getValidateConsumerMeterSerial(
      scenario,
      validateMeterNotInSystemSerial,
    );
  }
  if (
    scenario === "padded_serial" ||
    scenario === "unknown_query" ||
    scenario === "invalid_org_zero" ||
    scenario === "invalid_org_negative" ||
    scenario === "foreign_org_id" ||
    scenario === "duplicate_get" ||
    scenario === "organisation_lookup"
  ) {
    return resolveKnownValidateMeterSerial();
  }
  return "";
}

export const validateMeterTestCases: ValidateMeterTestCase[] = [
  {
    testName:
      "Can this meter be given to a consumer? — unused active meter is allowed",
    scenario: "assignable",
    envKey: "VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL",
    tags: ["@smoke", "@consumer", "@validate-meter"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — unknown serial is not in the system",
    scenario: "meter_not_in_system",
    envKey: "VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — meter already on another consumer is rejected",
    scenario: "already_assigned",
    envKey: "VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName: "Can this meter be given to a consumer? — switched-off meter is rejected",
    scenario: "inactive",
    envKey: "VALIDATE_CONSUMER_METER_INACTIVE_SERIAL",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — office filter is optional",
    scenario: "organisation_lookup",
    includeOrganisationLookupId: true,
    tags: ["@consumer", "@validate-meter", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — checking the same serial twice gives the same answer",
    scenario: "duplicate_get",
    duplicateGet: true,
    tags: ["@consumer", "@validate-meter", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — extra spaces around the serial are ignored",
    scenario: "padded_serial",
    padSerial: true,
    tags: ["@consumer", "@validate-meter", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — extra unused options are ignored",
    scenario: "unknown_query",
    extraParams: { unexpectedParam: "ignore-me" },
    tags: ["@consumer", "@validate-meter", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — a different office is still handled safely",
    scenario: "foreign_org_id",
    extraParams: {
      organisationLookupId: validateMeterForeignOrganisationLookupId,
    },
    tags: ["@consumer", "@validate-meter", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — serial number is required",
    scenario: "missing_meter_serial",
    expectedStatus: 400,
    errorField: "meterSerialNumber",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — empty serial is rejected",
    scenario: "empty_meter_serial",
    expectedStatus: 400,
    errorField: "meterSerialNumber",
    tags: ["@consumer", "@validate-meter", "@negative"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — spaces-only serial is rejected",
    scenario: "whitespace_serial",
    expectedStatus: 400,
    errorField: "meterSerialNumber",
    tags: ["@consumer", "@validate-meter", "@negative", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — invalid office 0 is rejected",
    scenario: "invalid_org_zero",
    expectedStatus: 400,
    errorField: "organisationLookupId",
    extraParams: { organisationLookupId: 0 },
    tags: ["@consumer", "@validate-meter", "@negative", "@edge"],
  },
  {
    testName:
      "Can this meter be given to a consumer? — invalid office number is rejected",
    scenario: "invalid_org_negative",
    expectedStatus: 400,
    errorField: "organisationLookupId",
    extraParams: { organisationLookupId: -1 },
    tags: ["@consumer", "@validate-meter", "@negative", "@edge"],
  },
];
