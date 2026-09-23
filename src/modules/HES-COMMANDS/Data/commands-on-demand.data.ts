import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

/** POST /indore/commands/on-demand — type `on_demand_profile` (no otp). */
export type OnDemandCommandType = "on_demand_profile";

export interface OnDemandCommandData {
  formattedProfileObisCode: string;
  sampleStartTime: string;
  sampleStopTime: string;
}

export const commandsOnDemandData = {
  defaultType: "on_demand_profile" as OnDemandCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  /** Live UI event-log OBIS; catalog example uses `1.0.99.1.0.255`. */
  defaultFormattedProfileObisCode: "0.0.99.98.0.255",
  catalogExampleObisCode: "1.0.99.1.0.255",
  defaultSampleStartTime: "2024-04-29T00:00:00+05:30",
  defaultSampleStopTime: "2024-04-29T23:59:59+05:30",
  expectedAction: "ON_DEMAND_PROFILE",
  initMessagePattern: /on demand profile completed successfully/i,
  queryMessagePattern:
    /on demand profile completed successfully|hes unreachable|job finished|job status fetched successfully/i,
  hesUnreachableMessagePattern: /hes unreachable/i,
} as const;

export const ON_DEMAND_PATH = "/indore/commands/on-demand";

export interface OnDemandRequestBody {
  type: OnDemandCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  commandData: OnDemandCommandData;
}

export function buildOnDemandBody(
  overrides: Partial<Omit<OnDemandRequestBody, "commandData">> & {
    commandData?: Partial<OnDemandCommandData>;
  } = {},
): OnDemandRequestBody {
  const { commandData: commandDataOverrides, ...rest } = overrides;
  return {
    type: commandsOnDemandData.defaultType,
    meters: commandsOnDemandData.defaultMeterSerial,
    ...rest,
    commandData: {
      formattedProfileObisCode: commandsOnDemandData.defaultFormattedProfileObisCode,
      sampleStartTime: commandsOnDemandData.defaultSampleStartTime,
      sampleStopTime: commandsOnDemandData.defaultSampleStopTime,
      ...commandDataOverrides,
    },
  };
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
