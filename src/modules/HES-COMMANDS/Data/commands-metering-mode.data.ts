import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type MeteringModeCommandType =
  | "metering_mode_get"
  | "metering_mode_set_import_export"
  | "metering_mode_set_import";

export const commandsMeteringModeData = {
  defaultType: "metering_mode_get" as MeteringModeCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  initMessagePattern: /get metering mode/i,
  queryFinishedMessagePattern: /job finished|synced from meterStatusForJob/i,
  hesCallbackNotePattern: /final completion status will be delivered via hes callback/i,
} as const;

export const METERING_MODE_PATH = "/indore/commands/metering-mode";

export interface MeteringModeRequestBody {
  type: MeteringModeCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
}

export function buildMeteringModeBody(
  overrides: Partial<MeteringModeRequestBody> = {},
): MeteringModeRequestBody {
  return {
    type: commandsMeteringModeData.defaultType,
    meters: commandsMeteringModeData.defaultMeterSerial,
    ...overrides,
  };
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
