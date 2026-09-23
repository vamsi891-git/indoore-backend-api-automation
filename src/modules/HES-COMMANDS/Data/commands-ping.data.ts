import { commandsMeterData } from "./commands-meter.data";

/** POST /indore/commands/ping — sync connectivity check (no otp). */
export const commandsPingData = {
  defaultType: "ping" as const,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  /** Ping waits on HES; sample ~5s, allow headroom. */
  maxResponseTimeMs: 60_000,
  expectedStates: ["CONNECTED", "DISCONNECTED", "NOT_CONNECTED", "UNKNOWN"] as const,
  expectedDisplayLabels: ["State"] as const,
  successMessagePattern: /ping meter completed successfully/i,
  /** Transient meter/HES failures — soft-find, do not fail smoke. */
  transientMeterFailurePattern:
    /no meter response from hes|comms timeout|meter busy|retry usually works|not connected|disconnected/i,
} as const;

/** Column headers for ping `meterResponseRows` labels. */
export const EXPECTED_PING_METER_RESPONSE_COLUMNS = [
  ...commandsPingData.expectedDisplayLabels,
] as const;

export const PING_PATH = "/indore/commands/ping";

export interface PingRequestBody {
  type: "ping";
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
}

export function buildPingBody(
  overrides: Partial<Omit<PingRequestBody, "type">> = {},
): PingRequestBody {
  return {
    type: commandsPingData.defaultType,
    meters: commandsPingData.defaultMeterSerial,
    ...overrides,
  };
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
