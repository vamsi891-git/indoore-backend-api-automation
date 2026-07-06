import type { APIRequestContext } from "@playwright/test";
import fs from "fs";
import path from "path";
import { CreateMeterApi } from "../Api/create-meter.api";
import { ValidateDtrMeterApi } from "../Api/validate-dtr-meter.api";
import { buildCreateMeterRequest } from "./create-meter.data";

export const DEFAULT_DTR_METER_POOL_TARGET = 4;
export const DEFAULT_DTR_METER_MAX_CREATE_ATTEMPTS = 12;

const DTR_METER_POOL_CACHE_FILE = path.join(
  process.cwd(),
  ".cache",
  "dtr-meter-pool.json",
);

let assignableMeterPool: string[] | null = null;
let assignableMeterCursor = 0;

export function setDtrAssignableMeterPool(serials: string[]): void {
  assignableMeterPool = serials.length > 0 ? serials : null;
  assignableMeterCursor = 0;
}

export function hasDtrAssignableMeterPool(): boolean {
  return (assignableMeterPool?.length ?? 0) > 0;
}

/** Rotate through the pool for each create-dtr payload (isolates tests when API wrongly creates a DTR). */
export function nextDtrAssignableMeterSerial(options?: {
  wrap?: boolean;
}): string | null {
  if (!assignableMeterPool?.length) {
    return null;
  }
  const wrap = options?.wrap ?? true;
  if (!wrap && assignableMeterCursor >= assignableMeterPool.length) {
    return null;
  }
  const serial = wrap
    ? assignableMeterPool[
        assignableMeterCursor % assignableMeterPool.length
      ]
    : assignableMeterPool[assignableMeterCursor];
  assignableMeterCursor += 1;
  return serial;
}

/** First pool entry — used by bulk-upload field rows that reuse one meter when API rejects. */
export function peekDtrAssignableMeterSerial(): string | null {
  return assignableMeterPool?.[0] ?? null;
}

export function generateProvisionedMeterSerial(): string {
  const rnd = Math.floor(Math.random() * 10000);
  return `CM${Date.now()}${rnd}`.slice(0, 12);
}

export interface ProvisionDtrAssignableMeterPoolOptions {
  targetCount?: number;
  maxCreateAttempts?: number;
  delayAfterCreateMs?: number;
  validateRetries?: number;
}

/**
 * E2E meter pool: create meters via add-meter, confirm assignable via validate-dtr-meter.
 * No manual env serials required for create-dtr / bulk-upload-dtr field or success tests.
 */
export async function provisionDtrAssignableMeterPool(
  authenticatedApi: APIRequestContext,
  options?: ProvisionDtrAssignableMeterPoolOptions,
): Promise<string[]> {
  const targetCount = options?.targetCount ?? DEFAULT_DTR_METER_POOL_TARGET;
  const maxCreateAttempts =
    options?.maxCreateAttempts ?? DEFAULT_DTR_METER_MAX_CREATE_ATTEMPTS;
  const delayAfterCreateMs = options?.delayAfterCreateMs ?? 1500;
  const validateRetries = options?.validateRetries ?? 4;

  const validateApi = new ValidateDtrMeterApi(authenticatedApi);
  const createMeterApi = new CreateMeterApi(authenticatedApi);
  const assignable = [...(assignableMeterPool ?? [])];

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  async function isAssignable(meterSerialNumber: string): Promise<boolean> {
    for (let attempt = 0; attempt < validateRetries; attempt += 1) {
      try {
        const { responseBody, rawResponse } =
          await validateApi.validateDtrMeter({ meterSerialNumber });
        const status = rawResponse.status();
        if (status === 429 || status === 504) {
          await sleep(5000);
          continue;
        }
        if (
          responseBody.success &&
          responseBody.data.valid &&
          responseBody.data.meterExists
        ) {
          return true;
        }
        return false;
      } catch {
        await sleep(1000);
      }
      if (attempt < validateRetries - 1) {
        await sleep(delayAfterCreateMs);
      }
    }
    return false;
  }

  async function createAndValidateMeter(): Promise<boolean> {
    const serial = generateProvisionedMeterSerial();
    try {
      const { rawResponse } = await createMeterApi.createMeter({
        ...buildCreateMeterRequest(serial),
        meterSerialNumber: serial,
        assetId: serial,
        meterRapdrpCode: serial,
        displayDigitCount: serial.length,
        meterStatus: true,
      });
      const status = rawResponse.status();
      if (status === 201) {
        await sleep(delayAfterCreateMs);
        if (
          (await isAssignable(serial)) &&
          !assignable.includes(serial)
        ) {
          assignable.push(serial);
          return true;
        }
      } else if (status === 429 || status === 504) {
        await sleep(5000);
      }
    } catch {
      await sleep(1500);
    }
    return false;
  }

  let createAttempts = 0;
  while (
    assignable.length < targetCount &&
    createAttempts < maxCreateAttempts
  ) {
    createAttempts += 1;
    await createAndValidateMeter();
    await sleep(800);
  }

  setDtrAssignableMeterPool(assignable);
  return assignable;
}

async function filterStillAssignableMeters(
  authenticatedApi: APIRequestContext,
  serials: string[],
  options?: ProvisionDtrAssignableMeterPoolOptions,
): Promise<string[]> {
  const validateRetries = options?.validateRetries ?? 4;
  const delayAfterCreateMs = options?.delayAfterCreateMs ?? 1500;
  const validateApi = new ValidateDtrMeterApi(authenticatedApi);
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));
  const stillAssignable: string[] = [];

  for (const serial of serials) {
    for (let attempt = 0; attempt < validateRetries; attempt += 1) {
      try {
        const { responseBody, rawResponse } =
          await validateApi.validateDtrMeter({ meterSerialNumber: serial });
        const status = rawResponse.status();
        if (status === 429 || status === 504) {
          await sleep(5000);
          continue;
        }
        if (
          responseBody.success &&
          responseBody.data.valid &&
          responseBody.data.meterExists &&
          !stillAssignable.includes(serial)
        ) {
          stillAssignable.push(serial);
        }
        break;
      } catch {
        await sleep(1000);
      }
      if (attempt < validateRetries - 1) {
        await sleep(delayAfterCreateMs);
      }
    }
    await sleep(300);
  }

  return stillAssignable;
}

function loadCachedMeterPool(): string[] | null {
  try {
    const raw = fs.readFileSync(DTR_METER_POOL_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as {
      serials?: string[];
      createdAt?: number;
    };
    const serials = parsed.serials?.filter(Boolean) ?? [];
    const ageMs = Date.now() - (parsed.createdAt ?? 0);
    if (serials.length > 0 && ageMs < 3_600_000) {
      return serials;
    }
  } catch {
    // no cache yet
  }
  return null;
}

function saveCachedMeterPool(serials: string[]): void {
  fs.mkdirSync(path.dirname(DTR_METER_POOL_CACHE_FILE), { recursive: true });
  fs.writeFileSync(
    DTR_METER_POOL_CACHE_FILE,
    JSON.stringify({ serials, createdAt: Date.now() }),
  );
}

/**
 * Reuse meters provisioned earlier in the same Playwright run (retry workers),
 * otherwise create fresh meters via add-meter.
 */
export async function ensureDtrAssignableMeterPool(
  authenticatedApi: APIRequestContext,
  options?: ProvisionDtrAssignableMeterPoolOptions,
): Promise<string[]> {
  if (hasDtrAssignableMeterPool()) {
    return assignableMeterPool ?? [];
  }

  const cached = loadCachedMeterPool();
  if (cached?.length) {
    const stillAssignable = await filterStillAssignableMeters(
      authenticatedApi,
      cached,
      options,
    );
    setDtrAssignableMeterPool(stillAssignable);
  }

  const provisioned = await provisionDtrAssignableMeterPool(
    authenticatedApi,
    options,
  );
  if (provisioned.length > 0) {
    saveCachedMeterPool(provisioned);
  }
  return provisioned;
}
