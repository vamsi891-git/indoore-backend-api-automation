import type { APIRequestContext } from "@playwright/test";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { SubmissionHistoryApi } from "../Api/submission-history.api";
import {
  ConsumerDetail,
  ConsumerDetailMapper,
} from "../Mapper/consumer-detail.mapper";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { SubmissionHistoryMapper } from "../Mapper/submission-history.mapper";
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
  if (result.rawResponse.status() === 200 && result.responseBody?.data) {
    const mapped = ConsumerDetailMapper.map(result.responseBody);
    if (!mapped.replacementEligible) {
      const serial = mapped.oldMeterSerial?.trim() || null;
      if (serial) return serial;
    }
  }

  // Fallback: any PENDING history row's old meter serial.
  const historyApi = new SubmissionHistoryApi(authenticatedApi);
  const history = await historyApi.getSubmissionHistory(1, 50, undefined, "PENDING");
  if (history.rawResponse.status() !== 200) return null;
  const items = SubmissionHistoryMapper.map(history.responseBody).items;
  for (const item of items) {
    const serial = item.oldMeterSerial?.trim();
    if (serial) return serial;
  }
  return null;
}

/** New meter already tied to an active PENDING replacement (lookup id + serial). */
export async function resolveActiveReplacementNewMeter(
  authenticatedApi: APIRequestContext,
): Promise<{ newMeterLookupId: number; newMeterSerial: string } | null> {
  const historyApi = new SubmissionHistoryApi(authenticatedApi);
  const history = await historyApi.getSubmissionHistory(1, 50, undefined, "PENDING");
  if (history.rawResponse.status() !== 200) return null;
  const items = SubmissionHistoryMapper.map(history.responseBody).items;
  const fromHistory = items
    .map((i) => i.newMeterSerial?.trim())
    .find((s) => !!s);
  const serial =
    fromHistory ||
    createSubmissionData.activeReplacementNewMeter.newMeterSerial.trim() ||
    null;
  if (!serial) return null;

  const validated = await new MeterValidationApi(authenticatedApi).validateMeter(
    serial,
  );
  if (validated.rawResponse.status() !== 200 || !validated.responseBody?.data) {
    return null;
  }
  const mapped = MeterValidationMapper.map(validated.responseBody);
  if (!mapped.meterLookupId) return null;
  return {
    newMeterLookupId: mapped.meterLookupId,
    newMeterSerial: mapped.meterSerial || serial,
  };
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
