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

  validateQueryFinishedMessage(message: string): void {
    expect(QUERY_FINISHED_MESSAGE.test(message)).toBe(true);
  }

  validateBillingMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsBillingData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();

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

    expect(
      commandsBillingData.billingCycles.includes(
        billingEntry!.billingCycle as (typeof commandsBillingData.billingCycles)[number],
      ),
    ).toBe(true);
  }

  validateBillingQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateBillingMeterResultRow(row!);
  }
}
