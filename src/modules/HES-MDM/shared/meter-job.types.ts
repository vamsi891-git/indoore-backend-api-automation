/** §3.4 MeterJobType */
export type MeterJobType =
  | "METER_COMMAND_GET"
  | "METER_COMMAND_SET"
  | "METER_ACTION"
  | "METER_FIRMWARE_UPGRADE";

/** §3.6 MeterJobCallbackType */
export type MeterJobCallbackType = "JOB_METER_CALLBACK" | "JOB_CALLBACK";

/** §3.10 MeterJobStatus */
export type MeterJobStatus =
  | "SCHEDULED"
  | "RUNNING"
  | "FINISHED"
  | "TIMEOUT_CANCELLED"
  | "CANCELLING"
  | "CANCELLED";

/** §3.11 MeterJobMeterStatusType */
export type MeterJobMeterStatusType =
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT_CANCELLED"
  | "DEVICE_UNREACHABLE";

/** §3.3 MeterJobCommandType */
export type MeterJobCommandType =
  | "PROFILE_CAPTURE_PERIOD"
  | "DEMAND_INTEGRATION_PERIOD"
  | "BILLING_PERIOD"
  | "TARIFF_CALENDAR"
  | "LOAD_CURTAILMENT"
  | "PAYMENT"
  | "MAX_DEMAND_RESET"
  | "DISCONNECTOR_CONTROL"
  | "METERING_MODE"
  | "PING"
  | "ON_DEMAND_PROFILE";

export type DisconnectorControlRequest = "DISCONNECT" | "CONNECT";
export type LoadCurtailmentState = "ENABLED" | "DISABLED";
export type MeteringMode = "IMPORT" | "IMPORT_EXPORT";
export type PaymentMode = "PREPAID" | "POSTPAID";

/** §3.5 MeterJobCallback */
export interface MeterJobCallback {
  callbackOn: MeterJobCallbackType[];
  callbackUrl: string;
}

/** §3.2 common command fields */
export interface MeterJobCommandBase {
  type: MeterJobCommandType;
  active?: boolean;
  activationTime?: string;
}

export interface OnDemandProfileCommand extends MeterJobCommandBase {
  type: "ON_DEMAND_PROFILE";
  formattedProfileObisCode: string;
  sampleStartTime: string;
  sampleStopTime: string;
}

export interface DisconnectorControlCommand extends MeterJobCommandBase {
  type: "DISCONNECTOR_CONTROL";
  controlRequest?: DisconnectorControlRequest;
}

export interface PingCommand extends MeterJobCommandBase {
  type: "PING";
}

export interface DemandIntegrationPeriodGetCommand extends MeterJobCommandBase {
  type: "DEMAND_INTEGRATION_PERIOD";
  active: boolean;
}

export interface DemandIntegrationPeriodSetCommand extends MeterJobCommandBase {
  type: "DEMAND_INTEGRATION_PERIOD";
  demandPeriod: number;
}

export interface ProfileCapturePeriodGetCommand extends MeterJobCommandBase {
  type: "PROFILE_CAPTURE_PERIOD";
  active: boolean;
}

export interface ProfileCapturePeriodSetCommand extends MeterJobCommandBase {
  type: "PROFILE_CAPTURE_PERIOD";
  capturePeriod: number;
}

export interface MaxDemandResetCommand extends MeterJobCommandBase {
  type: "MAX_DEMAND_RESET";
}

export interface BillingPeriodGetCommand extends MeterJobCommandBase {
  type: "BILLING_PERIOD";
  active: boolean;
}

export interface BillingPeriodSetCommand extends MeterJobCommandBase {
  type: "BILLING_PERIOD";
  date: { dayOfMonth: number };
}

export interface TariffCalendarGetCommand extends MeterJobCommandBase {
  type: "TARIFF_CALENDAR";
  active: boolean;
}

export interface LoadCurtailmentGetCommand extends MeterJobCommandBase {
  type: "LOAD_CURTAILMENT";
  active: boolean;
}

export interface LoadCurtailmentSetCommand extends MeterJobCommandBase {
  type: "LOAD_CURTAILMENT";
  loadCurtailmentState: LoadCurtailmentState;
}

export interface MeteringModeGetCommand extends MeterJobCommandBase {
  type: "METERING_MODE";
  active: boolean;
}

export interface MeteringModeSetCommand extends MeterJobCommandBase {
  type: "METERING_MODE";
  meteringMode: MeteringMode;
}

export interface PaymentGetCommand extends MeterJobCommandBase {
  type: "PAYMENT";
  active: boolean;
}

export interface PaymentSetCommand extends MeterJobCommandBase {
  type: "PAYMENT";
  mode: PaymentMode;
}

export type MeterCommand =
  | OnDemandProfileCommand
  | DisconnectorControlCommand
  | PingCommand
  | DemandIntegrationPeriodGetCommand
  | DemandIntegrationPeriodSetCommand
  | ProfileCapturePeriodGetCommand
  | ProfileCapturePeriodSetCommand
  | MaxDemandResetCommand
  | BillingPeriodGetCommand
  | BillingPeriodSetCommand
  | TariffCalendarGetCommand
  | LoadCurtailmentGetCommand
  | LoadCurtailmentSetCommand
  | MeteringModeGetCommand
  | MeteringModeSetCommand
  | PaymentGetCommand
  | PaymentSetCommand;

/** §3 Meter Job request */
export interface MeterJobRequest {
  jobConfiguration: { commands: MeterCommand[] };
  jobType: MeterJobType | string;
  jobName: string;
  meters: string[];
  startJob: boolean;
  timeoutTime: string;
  callback: MeterJobCallback;
}

/** §3.7 MeterJobSummary (query response) */
export interface MeterJobSummary {
  jobName: string;
  meterGroup?: string;
  scheduledTime?: string;
  timeoutTime?: string;
  createTime?: string;
  updateTime?: string;
  status: MeterJobStatus | string;
  jobType: MeterJobType | string;
  totalProcessedDevices?: number;
  totalSuccessfulDevices?: number;
  totalFailedDevices?: number;
  jobConfiguration?: { commands: MeterCommand[] };
  [key: string]: unknown;
}

/** §3.8 Ping response */
export interface MeterJobPingResponse {
  type?: string;
  elapsedTime?: number;
}

/** §3.9 MeterJobMeterStatus */
export interface MeterJobMeterStatus {
  meterId: string;
  status: MeterJobMeterStatusType | string;
  failureStep?: number;
  response?: MeterJobPingResponse | Record<string, unknown>;
}

/** §3.13 MeterJobCallbackPayload */
export interface MeterJobCallbackPayload {
  jobName: string;
  callbackType: MeterJobCallbackType;
  JobMeterStatusResponse?: {
    meters: MeterJobMeterStatus[];
  };
}

export type MeterJobCreateResponse = MeterJobSummary;
