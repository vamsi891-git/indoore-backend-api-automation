import type { APIRequestContext } from "@playwright/test";
import { DeviceManufacturerApi } from "../../UTILS-LOOKUP/Api/devicemanufacturer.api";
import { DeviceManufacturerMapper } from "../../UTILS-LOOKUP/Mapper/devicemanufacturer.mapper";
import {
  resolveMasterDataEnv,
  resolveMasterDataEnvInt,
} from "./master-data-env.helper";

/** Fixed dropdown values from UI / device-manufacturers lookup. */
export const METER_MANUFACTURER_DROPDOWN_VALUES = ["L&T", "HPL", "Genus"] as const;

export type MeterManufacturerName =
  (typeof METER_MANUFACTURER_DROPDOWN_VALUES)[number];

/** Default manufacturer label — same as bulk meter upload (`BULK_METER_MANUFACTURER_NAME`). */
export function getStaticMeterManufacturerName(): string {
  return resolveMasterDataEnv("BULK_METER_MANUFACTURER_NAME");
}

let resolvedManufacturerId: number | null = null;
let resolvedManufacturerName: string | null = null;
let ensurePromise: Promise<void> | null = null;

export function getCreateMeterDeviceManufacturerId(): number {
  const envOverride = resolveMasterDataEnvInt(
    "CREATE_METER_DEVICE_MANUFACTURER_TBL_REF_ID",
    0,
  );
  if (envOverride > 0) {
    return envOverride;
  }
  if (resolvedManufacturerId && resolvedManufacturerId > 0) {
    return resolvedManufacturerId;
  }
  return 1;
}

export function getCreateMeterModelId(): number {
  return resolveMasterDataEnvInt("CREATE_METER_METER_MODEL_TBL_REF_ID", 1);
}

export function getResolvedMeterManufacturerName(): string {
  return resolvedManufacturerName ?? getStaticMeterManufacturerName();
}

/**
 * Resolves `deviceManufacturerTblRefId` for add-meter from the static dropdown label (default L&T).
 * Env `CREATE_METER_DEVICE_MANUFACTURER_TBL_REF_ID` overrides lookup when set.
 */
export async function ensureMeterManufacturerContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    const envOverride = resolveMasterDataEnvInt(
      "CREATE_METER_DEVICE_MANUFACTURER_TBL_REF_ID",
      0,
    );
    if (envOverride > 0) {
      resolvedManufacturerId = envOverride;
      resolvedManufacturerName = getStaticMeterManufacturerName();
      console.log(
        `[meter-manufacturer] using env manufacturer id=${envOverride} name=${resolvedManufacturerName}`,
      );
      return;
    }

    const targetName = getStaticMeterManufacturerName();
    const api = new DeviceManufacturerApi(authenticatedApi);

    let rawResponse;
    let responseBody;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await api.getDeviceManufacturers();
      rawResponse = result.rawResponse;
      responseBody = result.responseBody;
      if (rawResponse.status() === 429 || rawResponse.status() === 503) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!rawResponse || rawResponse.status() !== 200 || !responseBody?.success) {
      throw new Error(
        `device-manufacturers lookup failed (status ${rawResponse?.status() ?? "unknown"})`,
      );
    }

    const data = DeviceManufacturerMapper.mapData(responseBody.data);
    const match = data.items.find(
      (item) => item.name.trim() === targetName.trim(),
    );
    if (!match) {
      const available = data.items.map((item) => item.name).join(", ");
      throw new Error(
        `Meter manufacturer "${targetName}" not found in dropdown. Available: ${available}`,
      );
    }

    resolvedManufacturerId = match.id;
    resolvedManufacturerName = match.name;
    console.log(
      `[meter-manufacturer] resolved name="${match.name}" id=${match.id}`,
    );
  })().catch((err) => {
    // Don't let a transient failure permanently poison this context for the
    // rest of the worker — clear the cached promise so the next test retries.
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
}
