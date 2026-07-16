import type { APIRequestContext } from "@playwright/test";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import {
  ConsumerDetail,
  ConsumerDetailMapper,
} from "../Mapper/consumer-detail.mapper";
import {
  createSubmissionData,
  resolvePreferredEligibleConsumerId,
} from "../Data/create-submission.data";
import { CreateMeterApi } from "../../MASTER-DATA/Api/create-meter.api";
import { buildCreateMeterRequest } from "../../MASTER-DATA/Data/create-meter.data";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { pauseMs } from "./response.helper";

const PROBE_PACING_MS = 200;

function hasUsableSubmissionIdentity(
  mapped?: ConsumerDetail | null,
): boolean {
  return Boolean(
    mapped?.consumerId &&
      Number.isInteger(mapped.oldMeterLookupId) &&
      mapped.oldMeterLookupId > 0 &&
      mapped.oldMeterSerial?.trim(),
  );
}

async function probeConsumerDetail(
  detailApi: ConsumerDetailApi,
  consumerId: number,
): Promise<ConsumerDetail | null> {
  try {
    const result = await detailApi.getConsumerDetail(consumerId);
    if (result.rawResponse.status() !== 200 || !result.responseBody?.data) {
      return null;
    }
    return ConsumerDetailMapper.map(result.responseBody);
  } catch {
    return null;
  }
}

/**
 * Find a replacement-eligible consumer (replacementEligible === true).
 */
export async function findEligibleConsumer(
  authenticatedApi: APIRequestContext,
): Promise<ConsumerDetail> {
  const detailApi = new ConsumerDetailApi(authenticatedApi);
  const preferred = resolvePreferredEligibleConsumerId();
  const candidates = [
    ...(preferred != null ? [preferred] : []),
    ...createSubmissionData.eligibleConsumerCandidates.filter(
      (id) => id !== preferred,
    ),
  ];

  for (const consumerId of candidates) {
    const mapped = await probeConsumerDetail(detailApi, consumerId);
    await pauseMs(PROBE_PACING_MS);
    if (
      mapped &&
      mapped.replacementEligible &&
      hasUsableSubmissionIdentity(mapped)
    ) {
      return mapped;
    }
  }

  throw new Error(
    `No replacement-eligible consumer found. Tried candidates: ${candidates.join(", ")}`,
  );
}

/**
 * Any consumer with old-meter identity — used by create-submission negatives
 * that only need consumerId / oldMeterLookupId (not replacementEligible).
 */
export async function findUsableConsumer(
  authenticatedApi: APIRequestContext,
): Promise<ConsumerDetail> {
  const detailApi = new ConsumerDetailApi(authenticatedApi);
  const preferred = resolvePreferredEligibleConsumerId();
  const candidates = [
    ...(preferred != null ? [preferred] : []),
    ...createSubmissionData.eligibleConsumerCandidates.filter(
      (id) => id !== preferred,
    ),
  ];

  for (const consumerId of candidates) {
    const mapped = await probeConsumerDetail(detailApi, consumerId);
    await pauseMs(PROBE_PACING_MS);
    if (hasUsableSubmissionIdentity(mapped)) {
      return mapped as ConsumerDetail;
    }
  }

  throw new Error(
    `No usable consumer (with old meter) found. Tried: ${candidates.slice(0, 20).join(", ")}…`,
  );
}

/**
 * Find or create an eligible consumer for meter replacement happy paths.
 */
export async function ensureEligibleConsumer(
  authenticatedApi: APIRequestContext,
): Promise<ConsumerDetail> {
  try {
    return await findEligibleConsumer(authenticatedApi);
  } catch (firstError) {
    // Broader numeric scan outside the curated list (step 50 to stay under rate limits).
    const detailApi = new ConsumerDetailApi(authenticatedApi);
    const already = new Set(createSubmissionData.eligibleConsumerCandidates);
    for (let id = 5300; id <= 8000; id += 50) {
      if (already.has(id)) continue;
      const mapped = await probeConsumerDetail(detailApi, id);
      await pauseMs(PROBE_PACING_MS);
      if (
        mapped &&
        mapped.replacementEligible &&
        hasUsableSubmissionIdentity(mapped)
      ) {
        return mapped;
      }
    }
    throw firstError instanceof Error
      ? firstError
      : new Error(String(firstError));
  }
}

/**
 * Negatives that only need a real consumer+old meter identity.
 */
export async function ensureUsableConsumer(
  authenticatedApi: APIRequestContext,
): Promise<ConsumerDetail> {
  try {
    return await findUsableConsumer(authenticatedApi);
  } catch {
    return ensureEligibleConsumer(authenticatedApi);
  }
}

/**
 * Create a new unassigned meter and wait until MR validate reports valid:true.
 */
export async function provisionReplacementNewMeter(
  authenticatedApi: APIRequestContext,
): Promise<{ meterSerial: string; meterLookupId: number }> {
  const createMeterApi = new CreateMeterApi(authenticatedApi);
  let lastError = "";

  for (let attempt = 0; attempt < 4; attempt++) {
    const payload = {
      ...buildCreateMeterRequest(`mr-new-${Date.now()}-${attempt}`),
      meterStatus: true,
    };
    const createResult = await createMeterApi.createMeter(payload);
    const status = createResult.rawResponse.status();
    if (status === 201) {
      const validateApi = new MeterValidationApi(authenticatedApi);
      let last: ReturnType<typeof MeterValidationMapper.map> | null = null;
      for (let v = 0; v < 8; v++) {
        await pauseMs(1_500);
        const validateResult = await validateApi.validateMeter(
          payload.meterSerialNumber,
        );
        last = MeterValidationMapper.map(validateResult.responseBody);
        if (last.valid && last.meterLookupId > 0) {
          return {
            meterSerial: last.meterSerial || payload.meterSerialNumber,
            meterLookupId: last.meterLookupId,
          };
        }
      }
      throw new Error(
        `New meter ${payload.meterSerialNumber} not eligible after create. last=${JSON.stringify(last)}`,
      );
    }

    lastError = `status=${status} body=${JSON.stringify(createResult.responseBody)}`;
    // Sequence conflicts are transient — retry with a fresh serial.
    if (status !== 409) {
      break;
    }
    await pauseMs(1_000);
  }

  throw new Error(`Failed to create meter: ${lastError}`);
}

/** @deprecated Prefer ensureEligibleConsumer — kept for bulk runtime imports. */
export async function createAndWaitForEligibleConsumer(
  _authenticatedApi: APIRequestContext,
  _maxWaitAttempts = 8,
): Promise<ConsumerDetail | null> {
  // Creating a consumer without assigning a meter does not yield an MR-eligible
  // consumer. Callers should use ensureEligibleConsumer / findEligibleConsumer.
  return null;
}
