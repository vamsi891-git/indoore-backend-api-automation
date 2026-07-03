import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type LoadCurtailmentCommandType =
  | "load_curtailment_get"
  | "load_curtailment_set";

export const commandsLoadCurtailmentData = {
  defaultType: "load_curtailment_get" as LoadCurtailmentCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedHesResponseType: "LOAD_CURTAILMENT",
  loadCurtailmentStates: ["ENABLED", "DISABLED"] as const,
} as const;

export const LOAD_CURTAILMENT_PATH = "/indore/commands/load-curtailment";

export interface LoadCurtailmentRequestBody {
  type: LoadCurtailmentCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
}

export function buildLoadCurtailmentBody(
  overrides: Partial<LoadCurtailmentRequestBody> = {},
): LoadCurtailmentRequestBody {
  return {
    type: commandsLoadCurtailmentData.defaultType,
    meters: commandsLoadCurtailmentData.defaultMeterSerial,
    ...overrides,
  };
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
