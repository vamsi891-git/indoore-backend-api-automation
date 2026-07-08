import type { APIRequestContext } from "@playwright/test";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import type { ValidateMeterScenario } from "../Mapper/validatemeter.mapper";
import {
  ensureConsumerAssignableMeterPool,
  peekConsumerAssignableMeterSerial,
} from "../Data/consumer-assignable-meter-pool.data";
import { createConsumerData } from "../../MASTER-DATA/Data/create-consumer.data";
import { getValidateMeterSerial } from "../../MASTER-DATA/utils/validate-meter-runtime.helper";
import type { ValidateConsumerMeterRuntimeEnvKey } from "../Data/validatemeter.data";

const RUNTIME_SERIALS: Partial<Record<ValidateConsumerMeterRuntimeEnvKey, string>> =
  {};

function setRuntimeSerial(
  key: ValidateConsumerMeterRuntimeEnvKey,
  value: string,
): void {
  const trimmed = value.trim();
  if (trimmed) {
    RUNTIME_SERIALS[key] = trimmed;
  }
}

function envSerial(key: ValidateConsumerMeterRuntimeEnvKey): string {
  return RUNTIME_SERIALS[key] ?? process.env[key]?.trim() ?? "";
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
    const organisationLookupId = createConsumerData.organisationLookupId;

    const assignableFromEnv = envSerial(
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
    } else {
      await ensureConsumerAssignableMeterPool(authenticatedApi, {
        targetCount: 2,
        organisationLookupId,
      });
      const peeked = peekConsumerAssignableMeterSerial();
      if (
        peeked &&
        (await serialMatchesScenario(authenticatedApi, peeked, "assignable"))
      ) {
        setRuntimeSerial("VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL", peeked);
      }
    }

    const assignedCandidates = [
      envSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL"),
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
      envSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL"),
      getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
      "7060268",
    ].filter(Boolean);

    for (const serial of inactiveCandidates) {
      if (await serialMatchesScenario(authenticatedApi, serial, "inactive")) {
        setRuntimeSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL", serial);
        break;
      }
    }

    const notInSystemCandidates = [
      envSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL"),
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
      `[validate-consumer-meter-runtime] assignable=${envSerial("VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL") || "none"} not-in-system=${envSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL") || "none"} assigned=${envSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL") || "none"} inactive=${envSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL") || "none"}`,
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
      return envSerial("VALIDATE_CONSUMER_METER_ASSIGNABLE_SERIAL");
    case "meter_not_in_system":
      return (
        envSerial("VALIDATE_CONSUMER_METER_NOT_IN_SYSTEM_SERIAL") ||
        fallbackNotInSystemSerial
      );
    case "already_assigned":
      return envSerial("VALIDATE_CONSUMER_METER_ASSIGNED_SERIAL");
    case "inactive":
      return envSerial("VALIDATE_CONSUMER_METER_INACTIVE_SERIAL");
    default:
      return "";
  }
}
