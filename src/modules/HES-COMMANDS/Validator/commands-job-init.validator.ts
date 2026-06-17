import { expect } from "@playwright/test";
import {
  CommandJobInitData,
  CommandJobInitMeterResult,
  CommandJobInitResponse,
  CommandJobInitSummary,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";

const INIT_METER_STATUSES = [
  "IN_PROGRESS",
  "SUCCESS",
  "FAILED",
  "REJECTED",
  "PENDING",
] as const;

const JOB_NAME_PATTERN = /^\d+$/;

export class CommandsJobInitValidator {
  validateResponse(body: CommandJobInitResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.message).toBeTruthy();
  }

  validateErrorResponse(body: CommandJobInitResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateSummaryCounts(summary: CommandJobInitSummary): void {
    for (const value of [
      summary.requested,
      summary.duplicatesRemoved,
      summary.successful,
      summary.failed,
      summary.rejectedOutOfScope,
      summary.rejectedUnknown,
      summary.batchesProcessed,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }

    expect(summary.successful).toBeLessThanOrEqual(summary.requested);
    expect(summary.failed).toBeLessThanOrEqual(summary.requested);
    expect(summary.rejectedOutOfScope).toBeLessThanOrEqual(summary.requested);
    expect(summary.rejectedUnknown).toBeLessThanOrEqual(summary.requested);

    const accounted =
      summary.successful +
      summary.failed +
      summary.rejectedOutOfScope +
      summary.rejectedUnknown;
    expect(accounted).toBeLessThanOrEqual(summary.requested);
    expect(summary.batchesProcessed).toBeGreaterThan(0);
  }

  validateSuccessfulMeters(
    init: CommandJobInitData,
    requestedMeters: string[],
  ): void {
    expect(init.successfulMeters.length).toBe(init.summary.successful);

    for (const meterId of init.successfulMeters) {
      expect(meterId).toBe(meterId.trim());
      expect(/^\d+$/.test(meterId)).toBe(true);
      expect(requestedMeters).toContain(meterId);
    }
  }

  validateRejectedMeters(init: CommandJobInitData): void {
    const rejectedCount =
      init.summary.rejectedOutOfScope + init.summary.rejectedUnknown;
    expect(init.rejectedMeters.length).toBeLessThanOrEqual(rejectedCount);

    for (const meterId of init.rejectedMeters) {
      expect(meterId).toBe(meterId.trim());
      expect(/^\d+$/.test(meterId)).toBe(true);
      expect(init.successfulMeters).not.toContain(meterId);
    }
  }

  validateHesCallbackConfigured(init: CommandJobInitData): void {
    expect(init.hesCallbackConfigured).toBe(true);
    expect(init.note?.trim().length).toBeGreaterThan(0);
  }

  validateMeterResultRow(row: CommandJobInitMeterResult): void {
    expect(row.meterId).toBeTruthy();
    expect(/^\d+$/.test(row.meterId)).toBe(true);
    expect(INIT_METER_STATUSES).toContain(row.status);
    expect(row.jobName).toBeTruthy();
    expect(JOB_NAME_PATTERN.test(row.jobName)).toBe(true);
    expect(Number.isInteger(row.hesStatusCode)).toBe(true);
    expect(row.hesStatusCode).toBeGreaterThanOrEqual(0);
  }

  validateAllMeterResults(
    meterResults: CommandJobInitMeterResult[],
    expectedCount: number,
  ): void {
    expect(meterResults.length).toBe(expectedCount);

    const seen = new Set<string>();
    for (const row of meterResults) {
      this.validateMeterResultRow(row);
      expect(seen.has(row.meterId), `Duplicate meter row: ${row.meterId}`).toBe(
        false,
      );
      seen.add(row.meterId);
    }
  }

  validateInitMeterResultsAlignWithSummary(init: CommandJobInitData): void {
    const successRows = init.meterResults.filter(
      (r) => r.status === "SUCCESS" || r.status === "IN_PROGRESS",
    ).length;
    expect(successRows).toBeLessThanOrEqual(init.summary.successful);

    const failedRows = init.meterResults.filter((r) => r.status === "FAILED")
      .length;
    expect(failedRows).toBeLessThanOrEqual(init.summary.failed);
  }

  validateJobNamesPresent(meterResults: CommandJobInitMeterResult[]): void {
    for (const row of meterResults) {
      expect(row.jobName.trim().length).toBeGreaterThan(0);
    }
  }

  validateFullInitContract(
    mapped: MappedCommandJobInitData,
    requestedMeters: string[],
  ): void {
    this.validateSummaryCounts(mapped.init.summary);
    this.validateSuccessfulMeters(mapped.init, requestedMeters);
    this.validateRejectedMeters(mapped.init);
    this.validateHesCallbackConfigured(mapped.init);
    this.validateAllMeterResults(
      mapped.init.meterResults,
      mapped.init.summary.successful,
    );
    this.validateInitMeterResultsAlignWithSummary(mapped.init);
    this.validateJobNamesPresent(mapped.init.meterResults);
  }
}
