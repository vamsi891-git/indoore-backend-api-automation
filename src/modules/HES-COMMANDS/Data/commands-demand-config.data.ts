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
  expectedHesResponseType: "DEMAND_INTEGRATION_PERIOD",
} as const;

export const DEMAND_CONFIG_PATH = "/indore/commands/demand-config";

export interface DemandConfigRequestBody {
  type: DemandConfigCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  demandPeriod?: number;
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

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
