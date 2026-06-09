import { MeterJobBuilder } from "../shared/meter-job.builder";
import { hesObisCodes } from "./obis-codes.data";
import { formatHesDateTime } from "../shared/hes-datetime.util";

const DEFAULT_OBIS =
  process.env.HES_ODR_OBIS_CODE ?? hesObisCodes.blockLoadProfile;

function toHesDateTime(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return formatHesDateTime(date);
}

export const odrAsyncData = {
  maxResponseTimeMs: 120_000,
  validObisCode: DEFAULT_OBIS,
  instantaneousObisCode: hesObisCodes.instantaneousProfile,
  sampleStartTime: toHesDateTime(2),
  sampleStopTime: toHesDateTime(1),
  invalidObisCode: "INVALID_OBIS_CODE",
  maxRangeDays: 3
} as const;

export function buildValidOdrAsyncJob(obisCode = odrAsyncData.validObisCode) {
  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`odr_async_${Date.now()}`)
    .withCommand({
      type: "ON_DEMAND_PROFILE",
      formattedProfileObisCode: obisCode,
      sampleStartTime: odrAsyncData.sampleStartTime,
      sampleStopTime: odrAsyncData.sampleStopTime
    })
    .build();
}

export function buildInstantaneousOdrJob() {
  return buildValidOdrAsyncJob(odrAsyncData.instantaneousObisCode);
}

export function buildOdrJobMissingStartTime() {
  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`odr_missing_start_${Date.now()}`)
    .withCommand({
      type: "ON_DEMAND_PROFILE",
      formattedProfileObisCode: odrAsyncData.validObisCode,
      sampleStartTime: "",
      sampleStopTime: odrAsyncData.sampleStopTime
    })
    .build();
}

export function buildOdrJobMissingStopTime() {
  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`odr_missing_stop_${Date.now()}`)
    .withCommand({
      type: "ON_DEMAND_PROFILE",
      formattedProfileObisCode: odrAsyncData.validObisCode,
      sampleStartTime: odrAsyncData.sampleStartTime,
      sampleStopTime: ""
    })
    .build();
}

export function buildOdrJobInvalidObis() {
  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`odr_invalid_obis_${Date.now()}`)
    .withCommand({
      type: "ON_DEMAND_PROFILE",
      formattedProfileObisCode: odrAsyncData.invalidObisCode,
      sampleStartTime: odrAsyncData.sampleStartTime,
      sampleStopTime: odrAsyncData.sampleStopTime
    })
    .build();
}

export function buildOdrJobStartAfterStop() {
  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`odr_start_after_stop_${Date.now()}`)
    .withCommand({
      type: "ON_DEMAND_PROFILE",
      formattedProfileObisCode: odrAsyncData.validObisCode,
      sampleStartTime: odrAsyncData.sampleStopTime,
      sampleStopTime: odrAsyncData.sampleStartTime
    })
    .build();
}

export function buildOdrJobRangeExceedsThreeDays() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 5);
  const stop = new Date();

  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`odr_range_exceeded_${Date.now()}`)
    .withCommand({
      type: "ON_DEMAND_PROFILE",
      formattedProfileObisCode: odrAsyncData.validObisCode,
      sampleStartTime: formatHesDateTime(start),
      sampleStopTime: formatHesDateTime(stop)
    })
    .build();
}

export const odrSyncData = {
  meterId: process.env.HES_TEST_METER_ID ?? "TEST_METER_001",
  sampleStartTime: toHesDateTime(2),
  sampleStopTime: toHesDateTime(1),
  invalidMeterId: "INVALID_METER_ID"
} as const;
