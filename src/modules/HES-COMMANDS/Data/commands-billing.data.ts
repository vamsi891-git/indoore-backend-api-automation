import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";
export type BillingCommandType = "billing_period_get" | "billing_period_set";
export const commandsBillingData = {
  defaultType: "billing_period_get" as BillingCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedHesResponseType: "BILLING_PERIOD",
  billingCycles: ["MONTHLY", "WEEKLY", "DAILY"] as const,
} as const;
export const BILLING_PATH = "/indore/commands/billing";
export interface BillingRequestBody {
  type: BillingCommandType;
  meters: string[];
  /** Required for billing_period_set */
  dayOfMonth?: number;
  billingCycle?: (typeof commandsBillingData.billingCycles)[number];
}
export function buildBillingBody(
  overrides: Partial<BillingRequestBody> = {},
): BillingRequestBody {
  return {
    type: commandsBillingData.defaultType,
    meters: [commandsBillingData.defaultMeterSerial],
    ...overrides,
  };
}
