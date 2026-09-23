import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";
import { commandsBillingData } from "../Data/commands-billing.data";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

export class CommandsBillingValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(/billing period/i.test(mapped.message)).toBe(true);
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitInProgressStatus(mapped: MappedCommandJobInitData): void {
    for (const row of mapped.init.meterResults) {
      expect(row.status).toBe("IN_PROGRESS");
      expect(row.hesStatusCode).toBe(200);
    }
  }

  /** Async init: execution timings stay null until HES callback finishes. */
  validateInitAsyncTimings(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.commandExecutionTimeMs).toBeNull();
    expect(mapped.init.meterResponseTimeMs).toBeNull();
  }

  validateQueryFinishedMessage(message: string): void {
    expect(QUERY_FINISHED_MESSAGE.test(message)).toBe(true);
  }

  validateBillingMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsBillingData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();
    expect(row.message).toBeTruthy();
    expect(/billing period/i.test(row.message!)).toBe(true);
    expect(row.reason).toBeNull();

    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows?.length).toBeGreaterThan(0);
    for (const item of row.meterResponseRows ?? []) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
    }

    const dayRow = row.meterResponseRows?.find((r) => /day of month/i.test(r.label));
    const cycleRow = row.meterResponseRows?.find((r) => /billing cycle/i.test(r.label));
    expect(dayRow).toBeDefined();
    expect(cycleRow).toBeDefined();
    expect(/^\d+$/.test(dayRow!.value)).toBe(true);

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    expect((response as unknown[]).length).toBeGreaterThan(0);

    const billingEntry = (response as Record<string, unknown>[]).find(
      (item) => item.type === commandsBillingData.expectedHesResponseType,
    );
    expect(billingEntry).toBeDefined();
    expect(typeof billingEntry!.active).toBe("boolean");

    const date = billingEntry!.date as Record<string, unknown> | undefined;
    expect(date).toBeDefined();
    expect(Number.isInteger(date!.dayOfMonth)).toBe(true);
    expect((date!.dayOfMonth as number) >= 1).toBe(true);
    expect((date!.dayOfMonth as number) <= 31).toBe(true);
    expect(String(date!.dayOfMonth)).toBe(dayRow!.value);

    const billingCycle = String(billingEntry!.billingCycle ?? "");
    expect(
      commandsBillingData.billingCycles.includes(
        billingCycle as (typeof commandsBillingData.billingCycles)[number],
      ),
    ).toBe(true);
    expect(cycleRow!.value.toLowerCase()).toBe(billingCycle.toLowerCase());

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    expect(meta).toBeDefined();
    expect(meta!.commandApiType).toBe("billing_period_get");
    expect(typeof meta!.publicRequestId).toBe("string");
    expect(/^\d+$/.test(String(meta!.publicRequestId))).toBe(true);

    const startedMs = Date.parse(String(meta!.startedAt));
    const completedMs = Date.parse(String(meta!.completedAt));
    expect(Number.isFinite(startedMs)).toBe(true);
    expect(Number.isFinite(completedMs)).toBe(true);
    expect(completedMs).toBeGreaterThanOrEqual(startedMs);
    expect(Number(meta!.executionDurationMs)).toBeGreaterThanOrEqual(0);

    // Present on some FINISHED payloads (e.g. after a prior set); shape only when set.
    if (meta!.commandData != null) {
      expect(typeof meta!.commandData).toBe("object");
    }
  }

  validateBillingQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
    jobLevel?: {
      meterResponse?: string | null;
      meterResponseRows?: { label: string; value: string }[];
      message?: string | null;
    },
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateBillingMeterResultRow(row!);

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
}
