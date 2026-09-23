import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

/** POST /indore/commands/reset — both types require step-up 2FA (`otp`). */
export type ResetCommandType = "max_demand_reset" | "lrcf_reset";

export const commandsResetData = {
  defaultType: "max_demand_reset" as ResetCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  /** Reset actions typically finish as SET_CONFIG / similar; allow GET_CONFIG too. */
  expectedActions: ["SET_CONFIG", "GET_CONFIG", "RESET"] as const,
  initMessagePattern: /reset|max demand|lrcf/i,
  hesCallbackNotePattern: /final completion status will be delivered via hes callback/i,
  /** Transient meter/HES failures — job FINISHED but meter row FAILED; soft-find, do not fail smoke. */
  transientMeterFailurePattern:
    /no meter response from hes|comms timeout|meter busy|retry usually works/i,
} as const;

export const RESET_PATH = "/indore/commands/reset";

export interface ResetRequestBody {
  type: ResetCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  /** Step-up 2FA — required for all reset commands. */
  otp: string;
}

export function buildMaxDemandResetBody(
  overrides: Partial<Omit<ResetRequestBody, "otp">> & { otp: string },
): ResetRequestBody {
  return {
    type: "max_demand_reset",
    meters: commandsResetData.defaultMeterSerial,
    ...overrides,
  };
}

export function buildLrcfResetBody(
  overrides: Partial<Omit<ResetRequestBody, "otp">> & { otp: string },
): ResetRequestBody {
  return {
    type: "lrcf_reset",
    meters: commandsResetData.defaultMeterSerial,
    ...overrides,
  };
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
