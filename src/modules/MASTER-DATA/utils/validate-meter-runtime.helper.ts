import type { APIRequestContext } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { ValidateAddMeterApi } from "../Api/validate-add-meter.api";
import { ValidateDtrMeterApi } from "../Api/validate-dtr-meter.api";
import type { ValidateDtrMeterScenario } from "../Mapper/validate-dtr-meter.mapper";

function newUnusedMeterSerial(): string {
  const rnd = Math.floor(Math.random() * 10000);
  return `CM${Date.now()}${rnd}`.slice(0, 12);
}

export type ValidateMeterRuntimeKey =
  | "VALIDATE_ADD_METER_VALID_SERIAL"
  | "VALIDATE_ADD_METER_EXISTS_SERIAL"
  | "VALIDATE_DTR_METER_VALID_SERIAL"
  | "VALIDATE_DTR_METER_ON_DTR_SERIAL"
  | "VALIDATE_DTR_METER_INACTIVE_SERIAL"
  | "VALIDATE_DTR_METER_ASSIGNED_SERIAL";

const SERIALS: Partial<Record<ValidateMeterRuntimeKey, string>> = {};

export function getValidateMeterSerial(key: ValidateMeterRuntimeKey): string {
  return SERIALS[key] ?? "";
}

export function hasValidateMeterSerial(key: ValidateMeterRuntimeKey): boolean {
  return getValidateMeterSerial(key).length > 0;
}

function envSerial(key: ValidateMeterRuntimeKey): string {
  return process.env[key]?.trim() ?? "";
}

function save(key: ValidateMeterRuntimeKey, value: string): void {
  if (value.trim()) {
    SERIALS[key] = value.trim();
  }
}

async function checkAddMeter(
  api: APIRequestContext,
  serial: string,
): Promise<{ valid: boolean; reason?: string } | null> {
  try {
    const { responseBody, rawResponse } = await new ValidateAddMeterApi(
      api,
    ).validateAddMeter({ meterSerialNumber: serial });
    if (rawResponse.status() !== 200 || !responseBody.success) {
      return null;
    }
    return { valid: responseBody.data.valid, reason: responseBody.data.reason };
  } catch {
    return null;
  }
}

async function checkDtrMeter(
  api: APIRequestContext,
  serial: string,
): Promise<{ valid: boolean; reason?: string; meterExists?: boolean } | null> {
  try {
    const { responseBody, rawResponse } = await new ValidateDtrMeterApi(
      api,
    ).validateDtrMeter({ meterSerialNumber: serial });
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

function matchesDtr(
  data: { valid: boolean; reason?: string; meterExists?: boolean },
  scenario: ValidateDtrMeterScenario,
): boolean {
  if (scenario === "valid_unmapped") {
    return data.valid === true && data.meterExists === true;
  }
  if (scenario === "already_on_dtrs") {
    return data.valid === false && data.reason === "METER_ALREADY_ON_DTR";
  }
  if (scenario === "inactive") {
    return data.valid === false && data.reason === "METER_INACTIVE";
  }
  if (scenario === "already_assigned") {
    return data.valid === false && data.reason === "METER_ALREADY_ASSIGNED";
  }
  if (scenario === "not_found") {
    return data.valid === true && data.meterExists === false;
  }
  return false;
}

async function useEnvIfDtrMatches(
  api: APIRequestContext,
  key: ValidateMeterRuntimeKey,
  scenario: ValidateDtrMeterScenario,
): Promise<string> {
  const serial = envSerial(key);
  if (!serial) {
    return "";
  }
  const result = await checkDtrMeter(api, serial);
  return result && matchesDtr(result, scenario) ? serial : "";
}

function rowSerial(row: Record<string, unknown>): string {
  for (const key of ["meterSerialNumber", "MSN", "msn"]) {
    const value = row[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

async function serialsFromGet(
  api: APIRequestContext,
  path: string,
  params: Record<string, string | number>,
): Promise<string[]> {
  const found: string[] = [];
  try {
    const response = await getWithAutoRefresh(api, path, { params });
    if (!response.ok()) {
      return found;
    }
    const body = (await response.json()) as {
      data?: { rows?: Record<string, unknown>[]; items?: Record<string, unknown>[] };
    };
    const rows = body.data?.rows ?? body.data?.items ?? [];
    for (const row of rows) {
      const serial = rowSerial(row);
      if (serial && !found.includes(serial)) {
        found.push(serial);
      }
    }
  } catch {
    // list APIs are optional helpers
  }
  return found;
}

async function firstMatchingDtr(
  api: APIRequestContext,
  scenario: ValidateDtrMeterScenario,
  candidates: string[],
): Promise<string> {
  for (const serial of candidates) {
    const result = await checkDtrMeter(api, serial);
    if (result && matchesDtr(result, scenario)) {
      return serial;
    }
  }
  return "";
}

/** New serial that validate-add-meter accepts. GET only — does not create a meter. */
async function resolveAddValid(api: APIRequestContext): Promise<string> {
  const fromEnv = envSerial("VALIDATE_ADD_METER_VALID_SERIAL");
  if (fromEnv) {
    const check = await checkAddMeter(api, fromEnv);
    if (check?.valid === true && !check.reason) {
      return fromEnv;
    }
  }
  for (let i = 0; i < 5; i += 1) {
    const serial = newUnusedMeterSerial();
    const check = await checkAddMeter(api, serial);
    if (check?.valid === true && !check.reason) {
      return serial;
    }
  }
  return "";
}

/** Existing serial from meter list (or .env). Does not POST a new meter. */
async function resolveAddExists(api: APIRequestContext): Promise<string> {
  const fromEnv = envSerial("VALIDATE_ADD_METER_EXISTS_SERIAL");
  if (fromEnv) {
    const check = await checkAddMeter(api, fromEnv);
    if (check?.valid === false && check.reason === "METER_ALREADY_EXISTS") {
      return fromEnv;
    }
  }
  const fromList = await serialsFromGet(
    api,
    "/indore/master-data/meter-master-data",
    { page: 1, limit: 20 },
  );
  for (const serial of fromList) {
    const check = await checkAddMeter(api, serial);
    if (check?.valid === false && check.reason === "METER_ALREADY_EXISTS") {
      return serial;
    }
  }
  return "";
}

async function resolveDtrScenario(
  api: APIRequestContext,
  key: ValidateMeterRuntimeKey,
  scenario: ValidateDtrMeterScenario,
  extraCandidates: () => Promise<string[]>,
): Promise<string> {
  const fromEnv = await useEnvIfDtrMatches(api, key, scenario);
  if (fromEnv) {
    return fromEnv;
  }
  return firstMatchingDtr(api, scenario, await extraCandidates());
}

/**
 * Finds meter serials for validate-add / validate-dtr GET tests.
 * Does not create or update meters. Missing serials → those tests skip.
 */
export async function ensureValidateMeterRuntimeContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  const dtrApi = new DtrMasterApi(authenticatedApi);
  const fetchDtrSerials = async () => {
    try {
      const { responseBody } = await dtrApi.getDtrMasterData({
        page: 1,
        limit: 25,
      });
      const rows = responseBody.data?.rows ?? responseBody.data?.items ?? [];
      return rows
        .map((row) => rowSerial(row as unknown as Record<string, unknown>))
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  const [
    addValid,
    addExists,
    dtrValid,
    dtrOnDtr,
    dtrInactive,
    dtrAssigned,
  ] = await Promise.all([
    resolveAddValid(authenticatedApi),
    resolveAddExists(authenticatedApi),
    resolveDtrScenario(
      authenticatedApi,
      "VALIDATE_DTR_METER_VALID_SERIAL",
      "valid_unmapped",
      async () => [],
    ),
    resolveDtrScenario(
      authenticatedApi,
      "VALIDATE_DTR_METER_ON_DTR_SERIAL",
      "already_on_dtrs",
      fetchDtrSerials,
    ),
    resolveDtrScenario(
      authenticatedApi,
      "VALIDATE_DTR_METER_INACTIVE_SERIAL",
      "inactive",
      async () => [],
    ),
    resolveDtrScenario(
      authenticatedApi,
      "VALIDATE_DTR_METER_ASSIGNED_SERIAL",
      "already_assigned",
      () =>
        serialsFromGet(authenticatedApi, "/indore/master-data/consumer-master-data", {
          page: 1,
          limit: 25,
          meterType: "all",
        }),
    ),
  ]);

  save("VALIDATE_ADD_METER_VALID_SERIAL", addValid);
  save("VALIDATE_ADD_METER_EXISTS_SERIAL", addExists);
  save("VALIDATE_DTR_METER_VALID_SERIAL", dtrValid);
  save("VALIDATE_DTR_METER_ON_DTR_SERIAL", dtrOnDtr);
  save("VALIDATE_DTR_METER_INACTIVE_SERIAL", dtrInactive);
  save("VALIDATE_DTR_METER_ASSIGNED_SERIAL", dtrAssigned);

  console.log(
    `[validate-meter] add-valid=${addValid || "skip"} add-exists=${addExists || "skip"} dtr-valid=${dtrValid || "skip"} dtr-on-dtr=${dtrOnDtr || "skip"} dtr-inactive=${dtrInactive || "skip"} dtr-assigned=${dtrAssigned || "skip"}`,
  );
}

/** Same as ensureValidateMeterRuntimeContext (write tests are skipped). */
export async function ensureDtrTestRuntimeContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  await ensureValidateMeterRuntimeContext(authenticatedApi);
}

export function getValidateDtrMeterSerialForScenario(
  scenario: ValidateDtrMeterScenario,
  notFoundSerial: string,
): string {
  if (scenario === "valid_unmapped") {
    return getValidateMeterSerial("VALIDATE_DTR_METER_VALID_SERIAL");
  }
  if (scenario === "already_on_dtrs") {
    return getValidateMeterSerial("VALIDATE_DTR_METER_ON_DTR_SERIAL");
  }
  if (scenario === "inactive") {
    return getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL");
  }
  if (scenario === "already_assigned") {
    return getValidateMeterSerial("VALIDATE_DTR_METER_ASSIGNED_SERIAL");
  }
  if (scenario === "not_found") {
    return notFoundSerial;
  }
  return "";
}

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
