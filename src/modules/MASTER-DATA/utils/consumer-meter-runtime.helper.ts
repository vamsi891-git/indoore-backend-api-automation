import type { APIRequestContext } from "@playwright/test";
import { ValidateMeterApi } from "../../CONSUMERS/Api/validatemeter.api";
import { ValidateMeterMapper } from "../../CONSUMERS/Mapper/validatemeter.mapper";
import {
  ensureConsumerAssignableMeterPool,
  setConsumerAssignableMeterPool,
} from "../../CONSUMERS/Data/consumer-assignable-meter-pool.data";
import { createConsumerData } from "../Data/create-consumer.data";
import {
  setCreateConsumerMeterContext,
  type CreateConsumerMeterContext,
} from "../Data/create-consumer.data";
import { setBulkConsumerMeterPool } from "../Data/bulk-upload-consumers.data";
import { resolveMasterDataEnv } from "./master-data-env.helper";
import { resolveConsumerMeterCascadeContext } from "./network-hierarchy-cascade.helper";

/**
 * Consumer meter runtime — same pattern as DTR assignable pool:
 * 1. Create CM* meters via add-meter
 * 2. Confirm assignable via GET /indore/consumers/validate-meter
 * 3. Align Zone → Sub Station → Feeder → DTR via network-hierarchy-cascade
 */
export interface ConsumerMeterRuntime extends CreateConsumerMeterContext {
  meterSerial: string;
  pool: string[];
}

let cachedRuntime: ConsumerMeterRuntime | null = null;
let ensurePromise: Promise<ConsumerMeterRuntime | null> | null = null;

export function getConsumerMeterRuntime(): ConsumerMeterRuntime | null {
  return cachedRuntime;
}

export function getConsumerAssignableMeterSerial(): string {
  return (
    cachedRuntime?.meterSerial ||
    resolveMasterDataEnv("BULK_CONSUMER_METER_SERIAL") ||
    ""
  );
}

export function hasConsumerAssignableMeterSerial(): boolean {
  return getConsumerAssignableMeterSerial().length > 0;
}

export interface EnsureConsumerMeterRuntimeOptions {
  targetPoolCount?: number;
  maxCreateAttempts?: number;
  organisationLookupId?: number;
}

export async function ensureConsumerMeterRuntimeContext(
  authenticatedApi: APIRequestContext,
  options?: EnsureConsumerMeterRuntimeOptions,
): Promise<ConsumerMeterRuntime | null> {
  if (cachedRuntime) {
    return cachedRuntime;
  }

  if (ensurePromise) {
    await ensurePromise;
    return cachedRuntime;
  }

  ensurePromise = (async () => {
    const organisationLookupId =
      options?.organisationLookupId ?? createConsumerData.organisationLookupId;

    const pool = await ensureConsumerAssignableMeterPool(authenticatedApi, {
      targetCount: options?.targetPoolCount ?? 4,
      maxCreateAttempts: options?.maxCreateAttempts ?? 15,
      organisationLookupId,
    });

    const envOverride = resolveMasterDataEnv("BULK_CONSUMER_METER_SERIAL");
    const candidates = [
      ...new Set([...(envOverride ? [envOverride] : []), ...pool]),
    ];

    const validateMeterApi = new ValidateMeterApi(authenticatedApi);

    for (const serial of candidates) {
      const meterMapped = ValidateMeterMapper.map(
        (
          await validateMeterApi.validateMeter(serial, organisationLookupId)
        ).responseBody,
      );
      if (!meterMapped.valid) {
        continue;
      }

      const context = await resolveConsumerMeterCascadeContext(
        authenticatedApi,
        {
          meterLookupId: meterMapped.meterLookupId,
          networkLookupId: meterMapped.networkLookupId,
        },
        organisationLookupId,
      );
      if (!context) {
        continue;
      }

      const activePool = pool.length > 0 ? pool : [serial];
      setCreateConsumerMeterContext(context);
      setConsumerAssignableMeterPool(activePool);
      setBulkConsumerMeterPool(activePool);

      cachedRuntime = {
        ...context,
        meterSerial: serial,
        pool: activePool,
      };

      console.log(
        `[consumer-meter-runtime] serial=${serial} pool=[${activePool.join(", ")}] zone="${context.zone}" ss="${context.subStation}" feeder="${context.feeder}" dtr="${context.dtr}" dtrId=${context.networkLookupId}`,
      );
      return cachedRuntime;
    }

    console.log("[consumer-meter-runtime] no assignable provisioned meter found");
    return null;
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
  return cachedRuntime;
}
