import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type DemandConfigCommandType =
  | "demand_integration_period_get"
  | "demand_integration_period_set";

export const commandsDemandConfigData = {
  defaultType: "demand_integration_period_get" as DemandConfigCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedSetAction: "SET_CONFIG",
  expectedHesResponseType: "DEMAND_INTEGRATION_PERIOD",
  /** Alternate demandPeriod seconds for SET round-trip (restore after). */
  setAlternateDemandPeriods: [1800, 900] as const,
} as const;

export const DEMAND_CONFIG_PATH = "/indore/commands/demand-config";

export interface DemandConfigRequestBody {
  type: DemandConfigCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  demandPeriod?: number;
  /** Step-up 2FA — required for demand_integration_period_set when 2FA is enabled. */
  otp?: string;
}

export function buildDemandConfigBody(
  overrides: Partial<DemandConfigRequestBody> = {},
): DemandConfigRequestBody {
  return {
    type: commandsDemandConfigData.defaultType,
    meters: commandsDemandConfigData.defaultMeterSerial,
    ...overrides,
  };
}

export function buildDemandConfigSetBody(
  overrides: Partial<DemandConfigRequestBody> = {},
): DemandConfigRequestBody {
  return buildDemandConfigBody({
    type: "demand_integration_period_set",
    demandPeriod: commandsDemandConfigData.setAlternateDemandPeriods[0],
    ...overrides,
  });
}

/** Parse "Demand Period: 1800" → 1800. */
export function parseDemandPeriodSeconds(meterResponse: string | null | undefined): number | null {
  const match = /demand period:\s*(\d+)/i.exec(meterResponse ?? "");
  if (!match) return null;
  return Number(match[1]);
}

export function pickAlternateDemandPeriod(currentSeconds: number): number {
  const [a, b] = commandsDemandConfigData.setAlternateDemandPeriods;
  return currentSeconds === a ? b : a;
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
