import type { APIRequestContext } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { CreateMeterApi } from "../Api/create-meter.api";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { ValidateAddMeterApi } from "../Api/validate-add-meter.api";
import { ValidateDtrMeterApi } from "../Api/validate-dtr-meter.api";
import { buildCreateMeterRequest } from "../Data/create-meter.data";
import { ensureMeterManufacturerContext } from "./meter-manufacturer.helper";
import { ensureConsumerLookupContext } from "./consumer-lookup.helper";
import { ensureNetworkHierarchyCascadeContext } from "./network-hierarchy-cascade.helper";
import {
  ensureDtrAssignableMeterPool,
  generateProvisionedMeterSerial,
  peekDtrAssignableMeterSerial,
} from "../Data/dtr-assignable-meter-pool.data";
import type { ValidateDtrMeterScenario } from "../Mapper/validate-dtr-meter.mapper";

export type ValidateMeterRuntimeKey =
  | "VALIDATE_ADD_METER_VALID_SERIAL"
  | "VALIDATE_ADD_METER_EXISTS_SERIAL"
  | "VALIDATE_DTR_METER_VALID_SERIAL"
  | "VALIDATE_DTR_METER_ON_DTR_SERIAL"
  | "VALIDATE_DTR_METER_INACTIVE_SERIAL"
  | "VALIDATE_DTR_METER_ASSIGNED_SERIAL";

const RUNTIME_SERIALS: Partial<Record<ValidateMeterRuntimeKey, string>> = {};

export function getValidateMeterSerial(key: ValidateMeterRuntimeKey): string {
  return RUNTIME_SERIALS[key] ?? process.env[key]?.trim() ?? "";
}

export function hasValidateMeterSerial(key: ValidateMeterRuntimeKey): boolean {
  return getValidateMeterSerial(key).length > 0;
}

function setValidateMeterSerial(
  key: ValidateMeterRuntimeKey,
  value: string,
): void {
  const trimmed = value.trim();
  if (trimmed) {
    RUNTIME_SERIALS[key] = trimmed;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createMeterWithStatus(
  authenticatedApi: APIRequestContext,
  serial: string,
  meterStatus: boolean,
): Promise<boolean> {
  const createMeterApi = new CreateMeterApi(authenticatedApi);
  try {
    const { rawResponse } = await createMeterApi.createMeter({
      ...buildCreateMeterRequest(serial),
      meterSerialNumber: serial,
      assetId: serial,
      meterRapdrpCode: serial.slice(0, 16),
      displayDigitCount: serial.length,
      meterStatus,
    });
    return rawResponse.status() === 201;
  } catch {
    return false;
  }
}

async function validateAddMeter(
  authenticatedApi: APIRequestContext,
  serial: string,
): Promise<{ valid: boolean; reason?: string } | null> {
  const api = new ValidateAddMeterApi(authenticatedApi);
  try {
    const { responseBody, rawResponse } = await api.validateAddMeter({
      meterSerialNumber: serial,
    });
    if (rawResponse.status() !== 200 || !responseBody.success) {
      return null;
    }
    return {
      valid: responseBody.data.valid,
      reason: responseBody.data.reason,
    };
  } catch {
    return null;
  }
}

async function validateDtrMeter(
  authenticatedApi: APIRequestContext,
  serial: string,
): Promise<{
  valid: boolean;
  reason?: string;
  meterExists?: boolean;
} | null> {
  const api = new ValidateDtrMeterApi(authenticatedApi);
  try {
    const { responseBody, rawResponse } = await api.validateDtrMeter({
      meterSerialNumber: serial,
    });
    if (rawResponse.status() !== 200 || !responseBody.success) {
      return null;
    }
    return {
      valid: responseBody.data.valid,
      reason: responseBody.data.reason,
      meterExists: responseBody.data.meterExists,
    };
  } catch {
    return null;
  }
}

function matchesDtrScenario(
  data: { valid: boolean; reason?: string; meterExists?: boolean },
  scenario: ValidateDtrMeterScenario,
): boolean {
  switch (scenario) {
    case "valid_unmapped":
      return data.valid === true && data.meterExists === true;
    case "already_on_dtrs":
      return data.valid === false && data.reason === "METER_ALREADY_ON_DTR";
    case "inactive":
      return data.valid === false && data.reason === "METER_INACTIVE";
    case "already_assigned":
      return data.valid === false && data.reason === "METER_ALREADY_ASSIGNED";
    case "not_found":
      return data.valid === true && data.meterExists === false;
    default:
      return false;
  }
}

async function envSerialMatchesDtrScenario(
  authenticatedApi: APIRequestContext,
  envKey: ValidateMeterRuntimeKey,
  scenario: ValidateDtrMeterScenario,
): Promise<string | null> {
  const fromEnv = process.env[envKey]?.trim();
  if (!fromEnv) {
    return null;
  }
  const result = await validateDtrMeter(authenticatedApi, fromEnv);
  if (result && matchesDtrScenario(result, scenario)) {
    return fromEnv;
  }
  return null;
}

async function resolveAddMeterValidNew(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const cached = getValidateMeterSerial("VALIDATE_ADD_METER_VALID_SERIAL");
  if (cached) {
    const check = await validateAddMeter(authenticatedApi, cached);
    if (check?.valid === true && !check.reason) {
      return cached;
    }
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const serial = generateProvisionedMeterSerial();
    const check = await validateAddMeter(authenticatedApi, serial);
    if (check?.valid === true && !check.reason) {
      return serial;
    }
    await sleep(200);
  }
  return "";
}

async function resolveAddMeterExists(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const cached = getValidateMeterSerial("VALIDATE_ADD_METER_EXISTS_SERIAL");
  if (cached) {
    const check = await validateAddMeter(authenticatedApi, cached);
    if (check?.valid === false && check.reason === "METER_ALREADY_EXISTS") {
      return cached;
    }
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const serial = generateProvisionedMeterSerial();
    if (await createMeterWithStatus(authenticatedApi, serial, true)) {
      await sleep(1200);
      const check = await validateAddMeter(authenticatedApi, serial);
      if (check?.valid === false && check.reason === "METER_ALREADY_EXISTS") {
        return serial;
      }
    }
    await sleep(500);
  }
  return "";
}

async function resolveDtrValidUnmapped(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const fromEnv = await envSerialMatchesDtrScenario(
    authenticatedApi,
    "VALIDATE_DTR_METER_VALID_SERIAL",
    "valid_unmapped",
  );
  if (fromEnv) {
    return fromEnv;
  }

  await ensureDtrAssignableMeterPool(authenticatedApi, {
    targetCount: 2,
    maxCreateAttempts: 12,
  });
  const peeked = peekDtrAssignableMeterSerial();
  if (peeked) {
    const check = await validateDtrMeter(authenticatedApi, peeked);
    if (check && matchesDtrScenario(check, "valid_unmapped")) {
      return peeked;
    }
  }
  return "";
}

async function fetchDtrMasterMeterSerials(
  authenticatedApi: APIRequestContext,
): Promise<string[]> {
  const api = new DtrMasterApi(authenticatedApi);
  const serials: string[] = [];
  try {
    const { responseBody } = await api.getDtrMasterData({ page: 1, limit: 25 });
    const rows =
      responseBody.data?.rows ??
      responseBody.data?.items ??
      [];
    for (const row of rows) {
      const raw = row.meterSerialNumber ?? (row as { MSN?: string }).MSN;
      const serial = raw == null ? "" : String(raw).trim();
      if (serial && !serials.includes(serial)) {
        serials.push(serial);
      }
    }
  } catch {
    // master list optional
  }
  return serials;
}

async function fetchConsumerMasterMeterSerials(
  authenticatedApi: APIRequestContext,
): Promise<string[]> {
  const serials: string[] = [];
  try {
    const response = await getWithAutoRefresh(
      authenticatedApi,
      "/indore/master-data/consumer-master-data",
      { params: { page: 1, limit: 25, meterType: "all" } },
    );
    if (!response.ok()) {
      return serials;
    }
    const body = (await response.json()) as {
      data?: {
        rows?: Array<Record<string, unknown>>;
        items?: Array<Record<string, unknown>>;
      };
    };
    const rows = body.data?.rows ?? body.data?.items ?? [];
    for (const row of rows) {
      for (const key of ["meterSerialNumber", "MSN", "msn", "Meter SL No."]) {
        const raw = row[key];
        const serial = raw == null ? "" : String(raw).trim();
        if (serial && !serials.includes(serial)) {
          serials.push(serial);
        }
      }
    }
  } catch {
    // optional
  }
  return serials;
}

async function discoverDtrScenarioSerial(
  authenticatedApi: APIRequestContext,
  scenario: ValidateDtrMeterScenario,
  candidates: string[],
): Promise<string | null> {
  for (const serial of candidates) {
    const result = await validateDtrMeter(authenticatedApi, serial);
    if (result && matchesDtrScenario(result, scenario)) {
      return serial;
    }
    await sleep(150);
  }
  return null;
}

async function resolveDtrOnDtr(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const fromEnv = await envSerialMatchesDtrScenario(
    authenticatedApi,
    "VALIDATE_DTR_METER_ON_DTR_SERIAL",
    "already_on_dtrs",
  );
  if (fromEnv) {
    return fromEnv;
  }

  const discovered = await discoverDtrScenarioSerial(
    authenticatedApi,
    "already_on_dtrs",
    await fetchDtrMasterMeterSerials(authenticatedApi),
  );
  return discovered ?? "";
}

async function resolveDtrInactive(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const fromEnv = await envSerialMatchesDtrScenario(
    authenticatedApi,
    "VALIDATE_DTR_METER_INACTIVE_SERIAL",
    "inactive",
  );
  if (fromEnv) {
    return fromEnv;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const serial = generateProvisionedMeterSerial();
    if (await createMeterWithStatus(authenticatedApi, serial, false)) {
      await sleep(1200);
      const result = await validateDtrMeter(authenticatedApi, serial);
      if (result && matchesDtrScenario(result, "inactive")) {
        return serial;
      }
    }
    await sleep(500);
  }
  return "";
}

async function resolveDtrAssigned(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const fromEnv = await envSerialMatchesDtrScenario(
    authenticatedApi,
    "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
    "already_assigned",
  );
  if (fromEnv) {
    return fromEnv;
  }

  const discovered = await discoverDtrScenarioSerial(
    authenticatedApi,
    "already_assigned",
    await fetchConsumerMasterMeterSerials(authenticatedApi),
  );
  return discovered ?? "";
}

let ensurePromise: Promise<void> | null = null;
let ensureDtrPromise: Promise<void> | null = null;

/**
 * Resolves validate-add-meter / validate-dtr-meter serials at runtime.
 * Env overrides are used when they still match the expected API scenario.
 */
export async function ensureValidateMeterRuntimeContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    await ensureMeterManufacturerContext(authenticatedApi);
    await ensureConsumerLookupContext(authenticatedApi);
    await ensureNetworkHierarchyCascadeContext(authenticatedApi);

    const [
      addValid,
      addExists,
      dtrValid,
      dtrOnDtr,
      dtrInactive,
      dtrAssigned,
    ] = await Promise.all([
      resolveAddMeterValidNew(authenticatedApi),
      resolveAddMeterExists(authenticatedApi),
      resolveDtrValidUnmapped(authenticatedApi),
      resolveDtrOnDtr(authenticatedApi),
      resolveDtrInactive(authenticatedApi),
      resolveDtrAssigned(authenticatedApi),
    ]);

    if (addValid) {
      setValidateMeterSerial("VALIDATE_ADD_METER_VALID_SERIAL", addValid);
    }
    if (addExists) {
      setValidateMeterSerial("VALIDATE_ADD_METER_EXISTS_SERIAL", addExists);
    }
    if (dtrValid) {
      setValidateMeterSerial("VALIDATE_DTR_METER_VALID_SERIAL", dtrValid);
    }
    if (dtrOnDtr) {
      setValidateMeterSerial("VALIDATE_DTR_METER_ON_DTR_SERIAL", dtrOnDtr);
    }
    if (dtrInactive) {
      setValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL", dtrInactive);
    }
    if (dtrAssigned) {
      setValidateMeterSerial(
        "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
        dtrAssigned,
      );
    }

    console.log(
      `[validate-meter-runtime] add-valid=${addValid || "none"} add-exists=${addExists || "none"} dtr-valid=${dtrValid || "none"} dtr-on-dtr=${dtrOnDtr || "none"} dtr-inactive=${dtrInactive || "none"} dtr-assigned=${dtrAssigned || "none"}`,
    );
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
}

/**
 * Lighter runtime setup for create-dtr / bulk-upload-dtr — skips consumer lookup
 * and add-meter serial resolution to reduce API load and rate-limit flakes.
 */
export async function ensureDtrTestRuntimeContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  if (ensureDtrPromise) {
    await ensureDtrPromise;
    return;
  }

  ensureDtrPromise = (async () => {
    await ensureMeterManufacturerContext(authenticatedApi);
    await ensureNetworkHierarchyCascadeContext(authenticatedApi);

    const [dtrOnDtr, dtrInactive, dtrAssigned] = await Promise.all([
      resolveDtrOnDtr(authenticatedApi),
      envSerialMatchesDtrScenario(
        authenticatedApi,
        "VALIDATE_DTR_METER_INACTIVE_SERIAL",
        "inactive",
      ).then(
        async (fromEnv) =>
          fromEnv || (await resolveDtrInactive(authenticatedApi)) || null,
      ),
      envSerialMatchesDtrScenario(
        authenticatedApi,
        "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
        "already_assigned",
      ).then(
        async (fromEnv) =>
          fromEnv || (await resolveDtrAssigned(authenticatedApi)) || null,
      ),
    ]);

    if (dtrOnDtr) {
      setValidateMeterSerial("VALIDATE_DTR_METER_ON_DTR_SERIAL", dtrOnDtr);
    }
    if (dtrInactive) {
      setValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL", dtrInactive);
    }
    if (dtrAssigned) {
      setValidateMeterSerial(
        "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
        dtrAssigned,
      );
    }

    console.log(
      `[dtr-test-runtime] dtr-on-dtr=${dtrOnDtr || "none"} dtr-inactive=${dtrInactive || "none"} dtr-assigned=${dtrAssigned || "none"}`,
    );
  })().catch((err) => {
    ensureDtrPromise = null;
    throw err;
  });

  await ensureDtrPromise;
}

export function getValidateDtrMeterSerialForScenario(
  scenario: ValidateDtrMeterScenario,
  notFoundSerial: string,
): string {
  switch (scenario) {
    case "valid_unmapped":
      return getValidateMeterSerial("VALIDATE_DTR_METER_VALID_SERIAL");
    case "already_on_dtrs":
      return getValidateMeterSerial("VALIDATE_DTR_METER_ON_DTR_SERIAL");
    case "inactive":
      return getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL");
    case "already_assigned":
      return getValidateMeterSerial("VALIDATE_DTR_METER_ASSIGNED_SERIAL");
    case "not_found":
      return notFoundSerial;
    default:
      return "";
  }
}

/** Scenarios that need a runtime-resolved meter serial before the test runs. */
export const RUNTIME_METER_SERIAL_SCENARIO_KEYS: Partial<
  Record<string, ValidateMeterRuntimeKey>
> = {
  meter_inactive: "VALIDATE_DTR_METER_INACTIVE_SERIAL",
  meter_on_dtr: "VALIDATE_DTR_METER_ON_DTR_SERIAL",
  meter_assigned: "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
  row_meter_inactive: "VALIDATE_DTR_METER_INACTIVE_SERIAL",
  row_meter_on_dtr: "VALIDATE_DTR_METER_ON_DTR_SERIAL",
  row_meter_already_mapped: "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
  row_already_exists: "VALIDATE_ADD_METER_EXISTS_SERIAL",
  already_exists: "VALIDATE_ADD_METER_EXISTS_SERIAL",
};

export function runtimeMeterSerialEnvKey(
  scenario: string,
): ValidateMeterRuntimeKey | undefined {
  return RUNTIME_METER_SERIAL_SCENARIO_KEYS[scenario];
}
