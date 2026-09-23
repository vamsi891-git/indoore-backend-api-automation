import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type ProfileConfigCommandType = "profile_capture_period_get" | "profile_capture_period_set";

export const commandsProfileConfigData = {
  defaultType: "profile_capture_period_get" as ProfileConfigCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedSetAction: "SET_CONFIG",
  expectedHesResponseType: "PROFILE_CAPTURE_PERIOD",
  profileTypes: ["INSTANTANEOUS", "BLOCK_LOAD", "DAILY_LOAD", "BILLING"] as const,
  /** Alternate Instantaneous periods used for SET round-trip (restore after). */
  setAlternateCapturePeriods: [900, 1200] as const,
  /** Default activation time for profile_capture_period_set (MDMS sample). */
  defaultActivationTime: "2024-01-01T00:00:00+05:30",
} as const;

export const PROFILE_CONFIG_PATH = "/indore/commands/profile-config";

export interface ProfileConfigRequestBody {
  type: ProfileConfigCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  capturePeriod?: number;
  profileType?: (typeof commandsProfileConfigData.profileTypes)[number];
  /** Required for profile_capture_period_set. */
  activationTime?: string;
  /** Step-up 2FA — required for profile_capture_period_set when 2FA is enabled. */
  otp?: string;
}

export function buildProfileConfigBody(
  overrides: Partial<ProfileConfigRequestBody> = {},
): ProfileConfigRequestBody {
  return {
    type: commandsProfileConfigData.defaultType,
    meters: commandsProfileConfigData.defaultMeterSerial,
    ...overrides,
  };
}

export function buildProfileConfigSetBody(
  overrides: Partial<ProfileConfigRequestBody> = {},
): ProfileConfigRequestBody {
  return buildProfileConfigBody({
    type: "profile_capture_period_set",
    profileType: "INSTANTANEOUS",
    capturePeriod: commandsProfileConfigData.setAlternateCapturePeriods[0],
    activationTime: commandsProfileConfigData.defaultActivationTime,
    ...overrides,
  });
}

/** Parse "Instantaneous: 900s; Block Load: 900s" → 900. */
export function parseInstantaneousCapturePeriodSeconds(
  meterResponse: string | null | undefined,
): number | null {
  const match = /instantaneous:\s*(\d+)\s*s?/i.exec(meterResponse ?? "");
  if (!match) return null;
  return Number(match[1]);
}

export function pickAlternateCapturePeriod(currentSeconds: number): number {
  const [a, b] = commandsProfileConfigData.setAlternateCapturePeriods;
  return currentSeconds === a ? b : a;
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
