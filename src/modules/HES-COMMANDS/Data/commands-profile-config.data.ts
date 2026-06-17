import { commandsMeterData } from "./commands-meter.data";

export type ProfileConfigCommandType =
  | "profile_capture_period_get"
  | "profile_capture_period_set";

export const commandsProfileConfigData = {
  defaultType: "profile_capture_period_get" as ProfileConfigCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  jobPollTimeoutMs: Number(process.env.JOB_POLL_TIMEOUT_MS ?? 120_000),
  jobPollIntervalMs: Number(process.env.JOB_POLL_INTERVAL_MS ?? 3_000),
  expectedInitAction: "GET_CONFIG",
  expectedHesResponseType: "PROFILE_CAPTURE_PERIOD",
  profileTypes: ["INSTANTANEOUS", "BLOCK_LOAD", "DAILY_LOAD", "BILLING"] as const,
} as const;

export const PROFILE_CONFIG_PATH = "/indore/commands/profile-config";

export interface ProfileConfigRequestBody {
  type: ProfileConfigCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  capturePeriod?: number;
  profileType?: (typeof commandsProfileConfigData.profileTypes)[number];
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

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
