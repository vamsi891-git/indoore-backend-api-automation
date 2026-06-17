import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { MappedQueryMeterJobData } from "../Mapper/commands-query-meter-job.mapper";
import { commandsPaymentData } from "../Data/commands-payment.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";

const ISO_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

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
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(commandsPaymentData.initMessagePattern.test(mapped.message)).toBe(
      true,
    );
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitNote(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.note).toBeDefined();
    expect(
      commandsPaymentData.hesCallbackNotePattern.test(mapped.init.note!),
    ).toBe(true);
  }

  validateInitInProgressStatus(mapped: MappedCommandJobInitData): void {
    for (const row of mapped.init.meterResults) {
      expect(row.status).toBe("IN_PROGRESS");
      expect(row.hesStatusCode).toBe(200);
      expect(row.errorMessage ?? null).toBeNull();
    }
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
    expect(commandsPaymentData.queryFinishedMessagePattern.test(message)).toBe(
      true,
    );
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
    expect(
      ISO_DATETIME_PATTERN.test(value),
      `${fieldLabel} should be ISO-8601 datetime`,
    ).toBe(true);
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
    this.validateNonNegativeAmount(
      token.amountAtLastRecharge,
      "token.amountAtLastRecharge",
    );
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

  validateHesResponseEnvelope(
    hes: Record<string, unknown>,
    expectedMeterId: string,
  ): void {
    expect(hes.meterId).toBe(expectedMeterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");
    expect(hes.progress).toBeNull();
    expect(Array.isArray(hes.response)).toBe(true);
  }

  validatePaymentMeterResultRow(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
  ): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.action).toBe(commandsPaymentData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();
    expect(row.hesResponse).toBeDefined();

    const hes = row.hesResponse as Record<string, unknown>;
    this.validateHesResponseEnvelope(hes, expectedMeterId);
    this.validatePaymentResponseArray(hes.response as unknown[]);
  }

  validatePaymentQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validatePaymentMeterResultRow(row!, expectedMeterId);
  }

  /** last_token_recharge_amount_get — token.amountAtLastRecharge is the primary field. */
  validateLastTokenRechargeAmountQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    this.validatePaymentQueryMeterResults(meterResults, expectedMeterId);

    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim())!;
    const hes = row.hesResponse as Record<string, unknown>;
    const payment = (hes.response as PaymentEntry[]).find(
      (e) => e.type === commandsPaymentData.expectedHesResponseType,
    )!;

    expect(payment.token).toBeDefined();
    expect(payment.token).toHaveProperty("amount");
    expect(payment.token).toHaveProperty("time");
    expect(payment.token).toHaveProperty("amountAtLastRecharge");
    expect(typeof payment.token.amountAtLastRecharge).toBe("number");
    this.validateNonNegativeAmount(
      payment.token.amountAtLastRecharge,
      "token.amountAtLastRecharge",
    );
  }
}
