import type { APIRequestContext } from "@playwright/test";
import fs from "fs";
import path from "path";
import { CreateMeterApi } from "../../MASTER-DATA/Api/create-meter.api";
import { buildCreateMeterRequest } from "../../MASTER-DATA/Data/create-meter.data";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import { createConsumerData } from "../../MASTER-DATA/Data/create-consumer.data";

export const DEFAULT_CONSUMER_METER_POOL_TARGET = 4;
export const DEFAULT_CONSUMER_METER_MAX_CREATE_ATTEMPTS = 12;

const CONSUMER_METER_POOL_CACHE_FILE = path.join(
  process.cwd(),
  ".cache",
  "consumer-meter-pool.json",
);

let assignableMeterPool: string[] | null = null;
let assignableMeterCursor = 0;

export function setConsumerAssignableMeterPool(serials: string[]): void {
  assignableMeterPool = serials.length > 0 ? serials : null;
  assignableMeterCursor = 0;
}

export function hasConsumerAssignableMeterPool(): boolean {
  if ((assignableMeterPool?.length ?? 0) > 0) {
    return true;
  }
  const cached = loadCachedMeterPool();
  if (cached?.length) {
    setConsumerAssignableMeterPool(cached);
    return true;
  }
  return false;
}

export function nextConsumerAssignableMeterSerial(options?: {
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

export function peekConsumerAssignableMeterSerial(): string | null {
  return assignableMeterPool?.[0] ?? null;
}

function generateProvisionedMeterSerial(): string {
  const rnd = Math.floor(Math.random() * 10000);
  return `CM${Date.now()}${rnd}`.slice(0, 12);
}

export interface ProvisionConsumerAssignableMeterPoolOptions {
  targetCount?: number;
  maxCreateAttempts?: number;
  delayAfterCreateMs?: number;
  validateRetries?: number;
  organisationLookupId?: number;
}

/**
 * E2E meter pool for consumer flows: create via add-meter, confirm assignable via
 * GET /indore/consumers/validate-meter (same gate as create-consumer.spec.ts).
 */
export async function provisionConsumerAssignableMeterPool(
  authenticatedApi: APIRequestContext,
  options?: ProvisionConsumerAssignableMeterPoolOptions,
): Promise<string[]> {
  const targetCount =
    options?.targetCount ?? DEFAULT_CONSUMER_METER_POOL_TARGET;
  const maxCreateAttempts =
    options?.maxCreateAttempts ?? DEFAULT_CONSUMER_METER_MAX_CREATE_ATTEMPTS;
  const delayAfterCreateMs = options?.delayAfterCreateMs ?? 1500;
  const validateRetries = options?.validateRetries ?? 4;
  const organisationLookupId =
    options?.organisationLookupId ?? createConsumerData.organisationLookupId;

  const validateApi = new ValidateMeterApi(authenticatedApi);
  const createMeterApi = new CreateMeterApi(authenticatedApi);
  const assignable = [...(assignableMeterPool ?? [])];

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  async function isAssignable(meterSerialNumber: string): Promise<boolean> {
    for (let attempt = 0; attempt < validateRetries; attempt += 1) {
      try {
        const { responseBody, rawResponse } = await validateApi.validateMeter(
          meterSerialNumber,
          organisationLookupId,
        );
        const status = rawResponse.status();
        if (status === 429 || status === 504) {
          await sleep(5000);
          continue;
        }
        const mapped = ValidateMeterMapper.map(responseBody);
        return mapped.valid;
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

  setConsumerAssignableMeterPool(assignable);
  return assignable;
}

async function filterStillAssignableMeters(
  authenticatedApi: APIRequestContext,
  serials: string[],
  options?: ProvisionConsumerAssignableMeterPoolOptions,
): Promise<string[]> {
  const validateRetries = options?.validateRetries ?? 4;
  const delayAfterCreateMs = options?.delayAfterCreateMs ?? 1500;
  const organisationLookupId =
    options?.organisationLookupId ?? createConsumerData.organisationLookupId;
  const validateApi = new ValidateMeterApi(authenticatedApi);
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));
  const stillAssignable: string[] = [];

  for (const serial of serials) {
    for (let attempt = 0; attempt < validateRetries; attempt += 1) {
      try {
        const { responseBody, rawResponse } = await validateApi.validateMeter(
          serial,
          organisationLookupId,
        );
        const status = rawResponse.status();
        if (status === 429 || status === 504) {
          await sleep(5000);
          continue;
        }
        const mapped = ValidateMeterMapper.map(responseBody);
        if (mapped.valid && !stillAssignable.includes(serial)) {
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
    const raw = fs.readFileSync(CONSUMER_METER_POOL_CACHE_FILE, "utf8");
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
  fs.mkdirSync(path.dirname(CONSUMER_METER_POOL_CACHE_FILE), {
    recursive: true,
  });
  fs.writeFileSync(
    CONSUMER_METER_POOL_CACHE_FILE,
    JSON.stringify({ serials, createdAt: Date.now() }),
  );
}

export async function ensureConsumerAssignableMeterPool(
  authenticatedApi: APIRequestContext,
  options?: ProvisionConsumerAssignableMeterPoolOptions,
): Promise<string[]> {
  const targetCount =
    options?.targetCount ?? DEFAULT_CONSUMER_METER_POOL_TARGET;

  let pool = assignableMeterPool ?? loadCachedMeterPool() ?? [];
  if (pool.length) {
    pool = await filterStillAssignableMeters(authenticatedApi, pool, options);
    setConsumerAssignableMeterPool(pool);
  }

  if (pool.length >= targetCount) {
    return pool;
  }

  const provisioned = await provisionConsumerAssignableMeterPool(
    authenticatedApi,
    {
      ...options,
      targetCount,
    },
  );
  if (provisioned.length > 0) {
    saveCachedMeterPool(provisioned);
  }
  return provisioned;
}
