import type { APIRequestContext } from "@playwright/test";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import type { ValidateMeterScenario } from "../Mapper/validatemeter.mapper";
import { getValidateMeterSerial } from "../../MASTER-DATA/utils/validate-meter-runtime.helper";
import type { ValidateConsumerMeterRuntimeEnvKey } from "../Data/validatemeter.data";

const RUNTIME_SERIALS: Partial<Record<ValidateConsumerMeterRuntimeEnvKey, string>> =
  {};

function setRuntimeSerial(key: ValidateConsumerMeterRuntimeEnvKey,value: string,): void {
  const trimmed = value.trim();
  if (trimmed) {
    RUNTIME_SERIALS[key] = trimmed;
  }
}

function verifiedSerial(key: ValidateConsumerMeterRuntimeEnvKey): string {
  return RUNTIME_SERIALS[key] ?? "";
}

function probeEnvSerial(key: ValidateConsumerMeterRuntimeEnvKey): string {
  return process.env[key]?.trim() ?? "";
}

function matchesScenario(
  mapped: ReturnType<typeof ValidateMeterMapper.mapData>,
  scenario: ValidateMeterScenario,
): boolean {
  switch (scenario) {
    case "assignable":
      return mapped.valid === true && mapped.meterExists === true;
    case "meter_not_in_system":
      return mapped.valid === true && mapped.meterExists === false;
    case "already_assigned":
      return mapped.valid === false && mapped.reason === "METER_ALREADY_ASSIGNED";
    case "inactive":
      return mapped.valid === false && mapped.reason === "METER_INACTIVE";
    default:
      return false;
  }
}

async function serialMatchesScenario(
  authenticatedApi: APIRequestContext,
  serial: string,
  scenario: ValidateMeterScenario,
): Promise<boolean> {
  const api = new ValidateMeterApi(authenticatedApi);
  try {
    const { responseBody, rawResponse } = await api.validateMeter(serial);
    if (rawResponse.status() !== 200) {
      return false;
    }
    return matchesScenario(ValidateMeterMapper.mapData(responseBody), scenario);
  } catch {
    return false;
  }
}

let ensurePromise: Promise<void> | null = null;

export async function ensureValidateConsumerMeterRuntimeContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    const assignableFromEnv = probeEnvSerial(
      "VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL",
    );
    if (
      assignableFromEnv &&
      (await serialMatchesScenario(
        authenticatedApi,
        assignableFromEnv,
        "assignable",
      ))
    ) {
      setRuntimeSerial(
        "VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL",
        assignableFromEnv,
      );
    } else if (assignableFromEnv) {
      console.warn(
        "[validate-consumer-meter-runtime] VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL is not an unassigned active meter — assignable case will skip",
      );
    }

    const assignedCandidates = [
      probeEnvSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL"),
      getValidateMeterSerial("VALIDATE_DTR_METER_ASSIGNED_SERIAL"),
      "85080223",
    ].filter(Boolean);

    for (const serial of assignedCandidates) {
      if (
        await serialMatchesScenario(authenticatedApi, serial, "already_assigned")
      ) {
        setRuntimeSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL", serial);
        break;
      }
    }

    const inactiveCandidates = [
      probeEnvSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL"),
      getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
      "7060268",
    ].filter(Boolean);

    for (const serial of inactiveCandidates) {
      if (await serialMatchesScenario(authenticatedApi, serial, "inactive")) {
        setRuntimeSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL", serial);
        break;
      }
    }
    if (
      probeEnvSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL") &&
      !verifiedSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL")
    ) {
      console.warn(
        "[validate-consumer-meter-runtime] VALIDATE_CONSUMER_METER_INACTIVE_SERIAL is not METER_INACTIVE — inactive case will skip",
      );
    }

    const notInSystemCandidates = [
      probeEnvSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL"),
      "891901",
      "MSN_INVALID_NONEXISTENT_00000",
    ].filter(Boolean);

    for (const serial of notInSystemCandidates) {
      if (
        await serialMatchesScenario(
          authenticatedApi,
          serial,
          "meter_not_in_system",
        )
      ) {
        setRuntimeSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL", serial);
        break;
      }
    }

    console.log(
      `[validate-consumer-meter-runtime] assignable=${verifiedSerial("VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL") || "none"} not-in-system=${verifiedSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL") || "none"} assigned=${verifiedSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL") || "none"} inactive=${verifiedSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL") || "none"}`,
    );
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
}

export function getValidateConsumerMeterSerial(
  scenario: ValidateMeterScenario,
  fallbackNotInSystemSerial: string,
): string {
  switch (scenario) {
    case "assignable":
      return verifiedSerial("VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL");
    case "meter_not_in_system":
      return (
        verifiedSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL") ||
        fallbackNotInSystemSerial
      );
    case "already_assigned":
      return verifiedSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL");
    case "inactive":
      return verifiedSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL");
    default:
      return "";
  }
}
