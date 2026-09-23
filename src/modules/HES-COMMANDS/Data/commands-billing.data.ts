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
  expectedSetAction: "SET_CONFIG",
  expectedHesResponseType: "BILLING_PERIOD",
  billingCycles: ["MONTHLY", "WEEKLY", "DAILY"] as const,
  /** Alternate dayOfMonth values for SET round-trip (restore after). */
  setAlternateDaysOfMonth: [1, 2] as const,
} as const;

export const BILLING_PATH = "/indore/commands/billing";

export interface BillingRequestBody {
  type: BillingCommandType;
  meters: string[];
  /** Required for billing_period_set */
  dayOfMonth?: number;
  billingCycle?: (typeof commandsBillingData.billingCycles)[number];
  /** Step-up 2FA — required for billing_period_set when 2FA is enabled. */
  otp?: string;
}

export function buildBillingBody(overrides: Partial<BillingRequestBody> = {}): BillingRequestBody {
  return {
    type: commandsBillingData.defaultType,
    meters: [commandsBillingData.defaultMeterSerial],
    ...overrides,
  };
}

export function buildBillingSetBody(
  overrides: Partial<BillingRequestBody> = {},
): BillingRequestBody {
  return buildBillingBody({
    type: "billing_period_set",
    dayOfMonth: commandsBillingData.setAlternateDaysOfMonth[0],
    billingCycle: "MONTHLY",
    ...overrides,
  });
}

/** Parse "Day Of Month: 2; Billing Cycle: Monthly" → 2. */
export function parseBillingDayOfMonth(meterResponse: string | null | undefined): number | null {
  const match = /day of month:\s*(\d+)/i.exec(meterResponse ?? "");
  if (!match) return null;
  return Number(match[1]);
}

/** Parse display cycle → MONTHLY | WEEKLY | DAILY. */
export function parseBillingCycle(
  meterResponse: string | null | undefined,
): (typeof commandsBillingData.billingCycles)[number] | null {
  const match = /billing cycle:\s*([A-Za-z]+)/i.exec(meterResponse ?? "");
  if (!match) return null;
  const upper = match[1].toUpperCase();
  if (
    commandsBillingData.billingCycles.includes(
      upper as (typeof commandsBillingData.billingCycles)[number],
    )
  ) {
    return upper as (typeof commandsBillingData.billingCycles)[number];
  }
  return null;
}

export function pickAlternateDayOfMonth(current: number): number {
  const [a, b] = commandsBillingData.setAlternateDaysOfMonth;
  return current === a ? b : a;
}
