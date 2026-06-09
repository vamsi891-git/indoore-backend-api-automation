import { MeterJobBuilder } from "../shared/meter-job.builder";
import { MeterJobType } from "../shared/meter-job.types";
import { hesApiPath } from "../shared/hes-paths.util";

export const hesMeterJobData = {
  maxResponseTimeMs: 120_000,
  expectedCreatedStatus: 201,
  paths: {
    meterJob: () => hesApiPath("meterJob"),
    queryMeterJob: () => hesApiPath("queryMeterJob"),
    meterStatusForJob: () => hesApiPath("meterStatusForJob"),
    onDemandProfile: () => hesApiPath("onDemandProfile"),
    meterPing: () => hesApiPath("meterPing"),
    manageMeterJob: () => hesApiPath("manageMeterJob"),
    searchMeters: () => hesApiPath("searchMeters"),
    meterSamples: () => hesApiPath("meterSamples"),
    meterAlarms: () => hesApiPath("meterAlarms"),
    networkPing: () => hesApiPath("networkPing")
  }
} as const;

export const validJobTypes: MeterJobType[] = [
  "METER_COMMAND_GET",
  "METER_COMMAND_SET",
  "METER_ACTION",
  "METER_FIRMWARE_UPGRADE"
];

export const invalidJobTypeCases = [
  { label: "invalid jobType", jobType: "INVALID_JOB_TYPE" },
  { label: "empty jobType", jobType: "" }
] as const;

export function buildPingJob() {
  return MeterJobBuilder.create()
    .withJobType("METER_ACTION")
    .withJobName(`ping_${Date.now()}`)
    .withCommand({ type: "PING" })
    .build();
}

export function buildRelayStatusJob() {
  return MeterJobBuilder.create()
    .withJobType("METER_COMMAND_GET")
    .withJobName(`relay_status_${Date.now()}`)
    .withGetCommand("DISCONNECTOR_CONTROL")
    .build();
}

export function buildDisconnectJob() {
  return MeterJobBuilder.create()
    .withJobType("METER_COMMAND_SET")
    .withJobName(`disconnect_${Date.now()}`)
    .withCommand({
      type: "DISCONNECTOR_CONTROL",
      controlRequest: "DISCONNECT"
    })
    .build();
}

export function buildReconnectJob() {
  return MeterJobBuilder.create()
    .withJobType("METER_COMMAND_SET")
    .withJobName(`reconnect_${Date.now()}`)
    .withCommand({
      type: "DISCONNECTOR_CONTROL",
      controlRequest: "CONNECT"
    })
    .build();
}
