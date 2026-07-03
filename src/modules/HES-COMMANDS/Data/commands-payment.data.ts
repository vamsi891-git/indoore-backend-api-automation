import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type PaymentCommandType =
  | "payment_get"
  | "payment_set_prepaid"
  | "payment_set_postpaid"
  | "payment_recharge_set"
  | "last_token_recharge_amount_get";

export const commandsPaymentData = {
  defaultType: "payment_get" as PaymentCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedHesResponseType: "PAYMENT",
  paymentModes: ["PREPAID", "POSTPAID"] as const,
  initMessagePattern: /get payment details/i,
  queryFinishedMessagePattern: /job finished|synced from meterStatusForJob/i,
  hesCallbackNotePattern: /final completion status will be delivered via hes callback/i,
} as const;

export const PAYMENT_PATH = "/indore/commands/payment";

export interface PaymentRequestBody {
  type: PaymentCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
}

export function buildPaymentBody(
  overrides: Partial<PaymentRequestBody> = {},
): PaymentRequestBody {
  return {
    type: commandsPaymentData.defaultType,
    meters: commandsPaymentData.defaultMeterSerial,
    ...overrides,
  };
}

export function buildLastTokenRechargeAmountGetBody(
  overrides: Partial<PaymentRequestBody> = {},
): PaymentRequestBody {
  return buildPaymentBody({
    type: "last_token_recharge_amount_get",
    meters: commandsPaymentData.defaultMeterSerial,
    ...overrides,
  });
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
