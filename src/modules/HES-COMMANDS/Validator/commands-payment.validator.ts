import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { MappedQueryMeterJobData } from "../Mapper/commands-query-meter-job.mapper";
import { commandsPaymentData } from "../Data/commands-payment.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export interface PaymentTokenDetails {
  amount: number;
  time: string;
  amountAtLastRecharge: number;
}

export interface PaymentBalanceDetails {
  amount: number;
  time: string;
}

export interface PaymentEntry {
  type: string;
  active: boolean;
  token: PaymentTokenDetails;
  balance: PaymentBalanceDetails;
  mode: string;
}

export class CommandsPaymentValidator {
  validateInitMessage(mapped: MappedCommandJobInitData, forSet = false): void {
    const pattern = forSet
      ? commandsPaymentData.setInitMessagePattern
      : commandsPaymentData.initMessagePattern;
    expect(pattern.test(mapped.message)).toBe(true);
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitNote(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.note).toBeDefined();
    expect(commandsPaymentData.hesCallbackNotePattern.test(mapped.init.note!)).toBe(true);
  }

  validateInitInProgressStatus(mapped: MappedCommandJobInitData): void {
    for (const row of mapped.init.meterResults) {
      expect(row.status).toBe("IN_PROGRESS");
      expect(row.hesStatusCode).toBe(200);
      expect(row.errorMessage ?? null).toBeNull();
    }
  }

  /** Async init: execution timings stay null until HES callback finishes. */
  validateInitAsyncTimings(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.commandExecutionTimeMs).toBeNull();
    expect(mapped.init.meterResponseTimeMs).toBeNull();
  }

  validateInitResponseEnvelope(body: CommandJobInitResponse): void {
    expect(body.success).toBe(true);
    expect(body.message).toBeTruthy();
    expect(body.data).toBeDefined();
    expect(body.error).toBeUndefined();

    const { data } = body;
    expect(data!.summary).toBeDefined();
    expect(Array.isArray(data!.successfulMeters)).toBe(true);
    expect(Array.isArray(data!.rejectedMeters)).toBe(true);
    expect(Array.isArray(data!.meterResults)).toBe(true);
    expect(data!.hesCallbackConfigured).toBe(true);
    expect(data!.note).toBeTruthy();
  }

  validateQueryFinishedMessage(message: string): void {
    expect(QUERY_FINISHED_MESSAGE.test(message)).toBe(true);
  }

  validateQueryResponseEnvelope(body: MappedQueryMeterJobData): void {
    expect(body.message).toBeTruthy();
    expect(body.job.jobName).toBeTruthy();
    expect(typeof body.job.synced).toBe("boolean");
    expect(typeof body.job.autoSynced).toBe("boolean");
    expect(body.job.hesJobStatus).toBe("FINISHED");
    expect(body.job.hesStatusCode).toBe(200);
    expect(body.job.summary).toBeDefined();
    expect(Array.isArray(body.job.meterResults)).toBe(true);
  }

  validateIsoDateTime(value: string, fieldLabel: string): void {
    expect(typeof value).toBe("string");
    expect(value.trim().length).toBeGreaterThan(0);
    expect(ISO_DATETIME_PATTERN.test(value), `${fieldLabel} should be ISO-8601 datetime`).toBe(
      true,
    );
    expect(Number.isNaN(Date.parse(value))).toBe(false);
  }

  validateNonNegativeAmount(value: number, fieldLabel: string): void {
    expect(Number.isFinite(value), `${fieldLabel} should be finite`).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }

  validatePaymentToken(token: PaymentTokenDetails): void {
    expect(token).toBeDefined();
    this.validateNonNegativeAmount(token.amount, "token.amount");
    this.validateIsoDateTime(token.time, "token.time");
    this.validateNonNegativeAmount(token.amountAtLastRecharge, "token.amountAtLastRecharge");
  }

  validatePaymentBalance(balance: PaymentBalanceDetails): void {
    expect(balance).toBeDefined();
    this.validateNonNegativeAmount(balance.amount, "balance.amount");
    this.validateIsoDateTime(balance.time, "balance.time");
  }

  validatePaymentEntry(entry: PaymentEntry): void {
    expect(entry.type).toBe(commandsPaymentData.expectedHesResponseType);
    expect(typeof entry.active).toBe("boolean");
    expect(entry.token).toBeDefined();
    expect(entry.balance).toBeDefined();
    expect(entry.mode).toBeTruthy();
    expect(
      commandsPaymentData.paymentModes.includes(
        entry.mode as (typeof commandsPaymentData.paymentModes)[number],
      ),
    ).toBe(true);

    this.validatePaymentToken(entry.token);
    this.validatePaymentBalance(entry.balance);
  }

  validatePaymentResponseArray(response: unknown[]): void {
    expect(response.length).toBeGreaterThan(0);

    const payment = (response as PaymentEntry[]).find(
      (e) => e.type === commandsPaymentData.expectedHesResponseType,
    );
    expect(payment).toBeDefined();
    this.validatePaymentEntry(payment!);
  }

  validateHesResponseEnvelope(hes: Record<string, unknown>, expectedMeterId: string): void {
    expect(hes.meterId).toBe(expectedMeterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");
    expect(hes.progress).toBeNull();
    expect(Array.isArray(hes.response)).toBe(true);
  }

  validateDisplayRowsMatchEntry(
    rows: { label: string; value: string }[],
    entry: PaymentEntry,
  ): void {
    for (const label of commandsPaymentData.expectedDisplayLabels) {
      const row = rows.find((r) => r.label === label);
      expect(row, `Missing meterResponseRows label "${label}"`).toBeDefined();
      expect(row!.value.length).toBeGreaterThan(0);
    }

    const modeRow = rows.find((r) => r.label === "Mode")!;
    expect(modeRow.value.toUpperCase()).toBe(entry.mode.toUpperCase());

    const balanceRow = rows.find((r) => r.label === "Balance")!;
    expect(balanceRow.value).toBe(String(entry.balance.amount));

    const tokenRow = rows.find((r) => r.label === "Token Amount")!;
    expect(tokenRow.value).toBe(String(entry.token.amount));
  }

  extractPaymentEntry(row: QueryMeterJobMeterResult): PaymentEntry {
    const hes = row.hesResponse as Record<string, unknown>;
    const payment = (hes.response as PaymentEntry[]).find(
      (e) => e.type === commandsPaymentData.expectedHesResponseType,
    );
    expect(payment).toBeDefined();
    return payment!;
  }

  validatePaymentMeterResultRow(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
    options?: { commandApiType?: string },
  ): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.action).toBe(commandsPaymentData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();
    expect(row.hesResponse).toBeDefined();
    expect(row.message).toBeTruthy();
    expect(/payment|token/i.test(row.message!)).toBe(true);
    expect(row.reason ?? null).toBeNull();

    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows?.length).toBeGreaterThan(0);
    for (const item of row.meterResponseRows ?? []) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
    }

    const hes = row.hesResponse as Record<string, unknown>;
    this.validateHesResponseEnvelope(hes, expectedMeterId);
    this.validatePaymentResponseArray(hes.response as unknown[]);

    const entry = this.extractPaymentEntry(row);
    this.validateDisplayRowsMatchEntry(row.meterResponseRows ?? [], entry);

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    expect(meta).toBeDefined();
    expect(meta!.commandApiType).toBe(options?.commandApiType ?? "payment_get");
    expect(typeof meta!.publicRequestId).toBe("string");
    expect(/^\d+$/.test(String(meta!.publicRequestId))).toBe(true);

    const startedMs = Date.parse(String(meta!.startedAt));
    const completedMs = Date.parse(String(meta!.completedAt));
    expect(Number.isFinite(startedMs)).toBe(true);
    expect(Number.isFinite(completedMs)).toBe(true);
    expect(completedMs).toBeGreaterThanOrEqual(startedMs);
    expect(Number(meta!.executionDurationMs)).toBeGreaterThanOrEqual(0);

    if (meta!.commandData != null) {
      expect(typeof meta!.commandData).toBe("object");
    }
  }

  validatePaymentQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
    jobLevel?: {
      meterResponse?: string | null;
      meterResponseRows?: { label: string; value: string }[];
      message?: string | null;
    },
    options?: { commandApiType?: string },
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validatePaymentMeterResultRow(row!, expectedMeterId, options);

    if (jobLevel?.meterResponse != null) {
      expect(jobLevel.meterResponse).toBe(row!.meterResponse);
    }
    if (jobLevel?.meterResponseRows != null) {
      expect(jobLevel.meterResponseRows).toEqual(row!.meterResponseRows);
    }
    if (jobLevel?.message != null) {
      expect(jobLevel.message).toBe(row!.message);
    }
  }

  /** last_token_recharge_amount_get — token.amountAtLastRecharge is the primary field. */
  validateLastTokenRechargeAmountQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
    jobLevel?: {
      meterResponse?: string | null;
      meterResponseRows?: { label: string; value: string }[];
      message?: string | null;
    },
  ): void {
    this.validatePaymentQueryMeterResults(meterResults, expectedMeterId, jobLevel, {
      commandApiType: "last_token_recharge_amount_get",
    });

    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim())!;
    const payment = this.extractPaymentEntry(row);

    expect(payment.token).toHaveProperty("amountAtLastRecharge");
    expect(typeof payment.token.amountAtLastRecharge).toBe("number");
    this.validateNonNegativeAmount(
      payment.token.amountAtLastRecharge,
      "token.amountAtLastRecharge",
    );
  }
}
