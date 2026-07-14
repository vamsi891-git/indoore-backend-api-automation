import type { APIRequestContext } from "@playwright/test";
import { CreateMeterApi } from "../../MASTER-DATA/Api/create-meter.api";
import { buildCreateMeterRequest } from "../../MASTER-DATA/Data/create-meter.data";
import { CreateMeterMapper } from "../../MASTER-DATA/Mapper/create-meter.mapper";
import { ensureMeterManufacturerContext } from "../../MASTER-DATA/utils/meter-manufacturer.helper";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import { MeterValidationApi } from "../Api/meter-validation.api";
import {
  buildCreateSubmissionPayload,
  createSubmissionData,
  resolvePreferredEligibleConsumerId,
  type CreateSubmissionRequestBody,
} from "../Data/create-submission.data";
import { ConsumerDetailMapper, type ConsumerDetail } from "../Mapper/consumer-detail.mapper";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { pauseMs } from "./response.helper";

const VALIDATE_SETTLE_MS = 1_500;
const VALIDATE_RETRIES = 8;

export type EligibleConsumerContext = ConsumerDetail;

export type ProvisionedNewMeter = {
  meterSerial: string;
  meterLookupId: number;
  createMeterStatus: number;
};

export type CreateSubmissionReadyContext = {
  consumer: EligibleConsumerContext;
  newMeter: ProvisionedNewMeter;
  payload: CreateSubmissionRequestBody;
};

export async function findEligibleConsumer(
  authenticatedApi: APIRequestContext,
): Promise<EligibleConsumerContext> {
  const detailApi = new ConsumerDetailApi(authenticatedApi);
  const preferred = resolvePreferredEligibleConsumerId();
  const candidates = [
    ...(preferred != null ? [preferred] : []),
    ...createSubmissionData.eligibleConsumerCandidates.filter(
      (id) => id !== preferred,
    ),
  ];

  for (const consumerId of candidates) {
    const { rawResponse, responseBody } =
      await detailApi.getConsumerDetail(consumerId);

    if (rawResponse.status() !== 200 || !responseBody?.data) {
      continue;
    }

    const mapped = ConsumerDetailMapper.map(responseBody);
    if (
      mapped.replacementEligible &&
      mapped.oldMeterLookupId > 0 &&
      mapped.oldMeterSerial.trim().length > 0
    ) {
      return mapped;
    }
  }

  throw new Error(
    "No replacement-eligible consumer found for create-submission tests. " +
      "Set METER_REPLACEMENT_ELIGIBLE_CONSUMER_ID or free a PENDING consumer.",
  );
}

export async function provisionReplacementNewMeter(
  authenticatedApi: APIRequestContext,
): Promise<ProvisionedNewMeter> {
  await ensureMeterManufacturerContext(authenticatedApi);

  const meterPayload = {
    ...buildCreateMeterRequest(`mr-sub-${Date.now()}`),
    meterStatus: true,
  };
  const meterSerial = meterPayload.meterSerialNumber;

  const createMeterApi = new CreateMeterApi(authenticatedApi);
  const createResult = await createMeterApi.createMeter(meterPayload);
  const mappedCreate = CreateMeterMapper.map(createResult.responseBody);

  if (createResult.rawResponse.status() !== 201) {
    throw new Error(
      `Failed to create meter for MR submission: status=${createResult.rawResponse.status()} body=${JSON.stringify(createResult.responseBody)}`,
    );
  }

  const validateApi = new MeterValidationApi(authenticatedApi);
  let validateResult = await validateApi.validateMeter(meterSerial);
  let validateMapped = MeterValidationMapper.map(validateResult.responseBody);

  for (
    let attempt = 0;
    attempt < VALIDATE_RETRIES &&
    !(
      validateResult.rawResponse.status() === 200 &&
      validateMapped.valid === true &&
      validateMapped.meterLookupId > 0
    );
    attempt += 1
  ) {
    await pauseMs(VALIDATE_SETTLE_MS);
    validateResult = await validateApi.validateMeter(meterSerial);
    validateMapped = MeterValidationMapper.map(validateResult.responseBody);
  }

  if (!validateMapped.valid || validateMapped.meterLookupId <= 0) {
    throw new Error(
      `New meter ${meterSerial} not eligible for replacement after create. last=${JSON.stringify(validateResult.responseBody)}`,
    );
  }

  return {
    meterSerial: validateMapped.meterSerial || meterSerial,
    meterLookupId:
      validateMapped.meterLookupId ||
      Number(mappedCreate.data?.meterLookupTblRefId) ||
      0,
    createMeterStatus: createResult.rawResponse.status(),
  };
}

export async function prepareCreateSubmissionContext(
  authenticatedApi: APIRequestContext,
): Promise<CreateSubmissionReadyContext> {
  const consumer = await findEligibleConsumer(authenticatedApi);
  const newMeter = await provisionReplacementNewMeter(authenticatedApi);

  const latitude = Number(consumer.latitude);
  const longitude = Number(consumer.longitude);

  const payload = buildCreateSubmissionPayload({
    consumerId: consumer.consumerId,
    oldMeterLookupId: consumer.oldMeterLookupId,
    oldMeterSerial: consumer.oldMeterSerial,
    newMeterLookupId: newMeter.meterLookupId,
    newMeterSerial: newMeter.meterSerial,
    latitude: Number.isFinite(latitude)
      ? latitude
      : createSubmissionData.defaultLatitude,
    longitude: Number.isFinite(longitude)
      ? longitude
      : createSubmissionData.defaultLongitude,
  });

  return { consumer, newMeter, payload };
}
