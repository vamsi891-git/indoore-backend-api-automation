import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type LoadCurtailmentCommandType = "load_curtailment_get" | "load_curtailment_set";

export const commandsLoadCurtailmentData = {
  defaultType: "load_curtailment_get" as LoadCurtailmentCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedSetAction: "SET_CONFIG",
  expectedHesResponseType: "LOAD_CURTAILMENT",
  loadCurtailmentStates: ["ENABLED", "DISABLED"] as const,
  /** Display labels expected on FINISHED meterResponseRows (GET sample). */
  expectedDisplayLabels: [
    "Power Limit Normal",
    "Current Limit Normal",
    "Lockout Max Counter",
    "Current Load Limit Status",
    "Power Load Limit Status",
    "Load Curtailment State",
    "Alert Period",
    "Lockout Period",
  ] as const,
  /** Safe SET round-trip: toggle loadCurtailmentState (HES ignores lockoutMaxCounter-only changes). */
  setAlternateStates: ["ENABLED", "DISABLED"] as const,
} as const;

export const LOAD_CURTAILMENT_PATH = "/indore/commands/load-curtailment";

/** Fields required for load_curtailment_set (from MDMS commandData + live GET). */
export interface LoadCurtailmentSetFields {
  loadCurtailmentState: (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number];
  powerLimitNormal: number;
  powerLimitEmergency: number;
  powerLimitMinOverThresholdDuration: number;
  powerLimitMinUnderThresholdDuration: number;
  currentLimitNormal: number;
  currentLimitEmergency: number;
  currentLimitMinOverThresholdDuration: number;
  currentLimitMinUnderThresholdDuration: number;
  alertPeriod: number;
  lockoutPeriod: number;
  lockoutMaxCounter: number;
}

export interface LoadCurtailmentRequestBody extends Partial<LoadCurtailmentSetFields> {
  type: LoadCurtailmentCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  /** Step-up 2FA — required for load_curtailment_set when 2FA is enabled. */
  otp?: string;
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

export function buildLoadCurtailmentSetBody(
  fields: LoadCurtailmentSetFields,
  overrides: Partial<LoadCurtailmentRequestBody> = {},
): LoadCurtailmentRequestBody {
  return buildLoadCurtailmentBody({
    type: "load_curtailment_set",
    ...fields,
    ...overrides,
  });
}

export function pickAlternateLoadCurtailmentState(
  current: (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
): (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number] {
  return current === "ENABLED" ? "DISABLED" : "ENABLED";
}

/** Parse "Load Curtailment State: Enabled" from meterResponse. */
export function parseLoadCurtailmentState(
  meterResponse: string | null | undefined,
): (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number] | null {
  const match = /load curtailment state:\s*([A-Za-z]+)/i.exec(meterResponse ?? "");
  if (!match) return null;
  const upper = match[1].toUpperCase();
  if (
    commandsLoadCurtailmentData.loadCurtailmentStates.includes(
      upper as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number],
    )
  ) {
    return upper as (typeof commandsLoadCurtailmentData.loadCurtailmentStates)[number];
  }
  return null;
}

/** Parse "Lockout Max Counter: 3" from meterResponse. */
export function parseLockoutMaxCounter(meterResponse: string | null | undefined): number | null {
  const match = /lockout max counter:\s*(\d+)/i.exec(meterResponse ?? "");
  if (!match) return null;
  return Number(match[1]);
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
