import type { APIRequestContext } from "@playwright/test";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import {
  ConsumerDetail,
  ConsumerDetailMapper,
} from "../Mapper/consumer-detail.mapper";
import {
  ensureEligibleConsumer,
  findUsableConsumer,
  provisionReplacementNewMeter,
} from "./create-submission.helper";
import { createSubmissionData } from "../Data/create-submission.data";
import { ensureMeterManufacturerContext } from "../../MASTER-DATA/utils/meter-manufacturer.helper";

export type MeterReplacementBulkRuntimeContext = {
  consumerId: number | string;
  oldMeterSerial: string;
  newMeterSerial: string;
  latitude: number | string;
  longitude: number | string;
};

export async function ensureMeterReplacementBulkRuntimeContext(
  authenticatedApi: APIRequestContext,
): Promise<MeterReplacementBulkRuntimeContext> {
  await ensureMeterManufacturerContext(authenticatedApi);

  const env = process.env.METER_REPLACEMENT_ELIGIBLE_CONSUMER_ID?.trim();
  if (env) {
    const detailApi = new ConsumerDetailApi(authenticatedApi);
    try {
      const result = await detailApi.getConsumerDetail(env);
      if (result.rawResponse.status() === 200 && result.responseBody?.data) {
        const mapped = ConsumerDetailMapper.map(result.responseBody);
        if (mapped.oldMeterSerial?.trim()) {
          const newMeter = await provisionReplacementNewMeter(authenticatedApi);
          return {
            consumerId: mapped.consumerId,
            oldMeterSerial: mapped.oldMeterSerial,
            newMeterSerial: newMeter.meterSerial,
            latitude: mapped.latitude || createSubmissionData.defaultLatitude,
            longitude: mapped.longitude || createSubmissionData.defaultLongitude,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  let consumer: ConsumerDetail;
  try {
    consumer = await ensureEligibleConsumer(authenticatedApi);
  } catch {
    consumer = await findUsableConsumer(authenticatedApi);
  }

  const newMeter = await provisionReplacementNewMeter(authenticatedApi);

  return {
    consumerId: consumer.consumerId,
    oldMeterSerial: consumer.oldMeterSerial,
    newMeterSerial: newMeter.meterSerial,
    latitude: consumer.latitude || createSubmissionData.defaultLatitude,
    longitude: consumer.longitude || createSubmissionData.defaultLongitude,
  };
}

/** Resolve a PENDING consumer's old meter serial for bulk negative fixtures. */
export async function resolvePendingConsumerOldMeterSerial(
  authenticatedApi: APIRequestContext,
): Promise<string | null> {
  const env =
    process.env.METER_REPLACEMENT_PENDING_CONSUMER_OLD_SERIAL?.trim() || "";
  if (env) return env;

  const detailApi = new ConsumerDetailApi(authenticatedApi);
  const result = await detailApi.getConsumerDetail(
    createSubmissionData.ineligibleConsumerId,
  );
  if (result.rawResponse.status() !== 200 || !result.responseBody?.data) {
    return null;
  }
  const mapped = ConsumerDetailMapper.map(result.responseBody);
  if (mapped.replacementEligible) {
    return null;
  }
  return mapped.oldMeterSerial?.trim() || null;
}

/** Use another consumer's assigned meter as an invalid "new" meter. */
export async function resolveAssignedNewMeterSerial(
  authenticatedApi: APIRequestContext,
  excludeOldSerial?: string,
): Promise<string | null> {
  const env =
    process.env.METER_REPLACEMENT_ASSIGNED_NEW_METER_SERIAL?.trim() || "";
  if (env) return env;

  const detailApi = new ConsumerDetailApi(authenticatedApi);
  for (const id of createSubmissionData.eligibleConsumerCandidates) {
    const result = await detailApi.getConsumerDetail(id);
    if (result.rawResponse.status() !== 200 || !result.responseBody?.data) {
      continue;
    }
    const mapped = ConsumerDetailMapper.map(result.responseBody);
    const serial = mapped.oldMeterSerial?.trim();
    if (serial && serial !== excludeOldSerial) {
      return serial;
    }
  }
  return null;
}
