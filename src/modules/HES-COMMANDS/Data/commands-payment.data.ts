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
  expectedDisplayLabels: ["Mode", "Balance", "Token Amount"] as const,
  initMessagePattern: /payment|token recharge/i,
  setInitMessagePattern: /payment|prepaid|postpaid|recharge/i,
  queryFinishedMessagePattern:
    /job finished|synced from meterStatusForJob|job status fetched successfully/i,
  hesCallbackNotePattern: /final completion status will be delivered via hes callback/i,
  /** Default recharge amount for payment_recharge_set round-trip (restore not used). */
  defaultRechargeAmount: 1,
} as const;

export const PAYMENT_PATH = "/indore/commands/payment";

export interface PaymentRequestBody {
  type: PaymentCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  /** Required for payment_recharge_set. */
  amount?: number;
  /** Step-up 2FA — required for payment_*_set when 2FA is enabled. */
  otp?: string;
}

export function buildPaymentBody(overrides: Partial<PaymentRequestBody> = {}): PaymentRequestBody {
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

export function buildPaymentSetPrepaidBody(
  overrides: Partial<PaymentRequestBody> = {},
): PaymentRequestBody {
  return buildPaymentBody({
    type: "payment_set_prepaid",
    ...overrides,
  });
}

export function buildPaymentSetPostpaidBody(
  overrides: Partial<PaymentRequestBody> = {},
): PaymentRequestBody {
  return buildPaymentBody({
    type: "payment_set_postpaid",
    ...overrides,
  });
}

export function buildPaymentRechargeSetBody(
  overrides: Partial<PaymentRequestBody> = {},
): PaymentRequestBody {
  return buildPaymentBody({
    type: "payment_recharge_set",
    amount: commandsPaymentData.defaultRechargeAmount,
    ...overrides,
  });
}

/** Parse "Mode: Postpaid; Balance: 0; Token Amount: 0" → POSTPAID. */
export function parsePaymentMode(
  meterResponse: string | null | undefined,
): (typeof commandsPaymentData.paymentModes)[number] | null {
  const match = /mode:\s*([A-Za-z]+)/i.exec(meterResponse ?? "");
  if (!match) return null;
  const upper = match[1].toUpperCase();
  if (
    commandsPaymentData.paymentModes.includes(
      upper as (typeof commandsPaymentData.paymentModes)[number],
    )
  ) {
    return upper as (typeof commandsPaymentData.paymentModes)[number];
  }
  return null;
}

export function pickAlternatePaymentSetType(
  currentMode: (typeof commandsPaymentData.paymentModes)[number],
): "payment_set_prepaid" | "payment_set_postpaid" {
  return currentMode === "POSTPAID" ? "payment_set_prepaid" : "payment_set_postpaid";
}

export function expectedModeAfterSet(
  setType: "payment_set_prepaid" | "payment_set_postpaid",
): (typeof commandsPaymentData.paymentModes)[number] {
  return setType === "payment_set_prepaid" ? "PREPAID" : "POSTPAID";
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
