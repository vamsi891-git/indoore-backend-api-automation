import { expect } from "@playwright/test";
import {
  MappedQueryMeterJobData,
  QueryMeterJobMeterResult,
  QueryMeterJobResponse,
  QueryMeterJobSummary,
} from "../Mapper/commands-query-meter-job.mapper";

export const METER_JOB_STATUSES = [
  "SUCCESS",
  "FAILED",
  "IN_PROGRESS",
  "REJECTED",
  "PENDING",
  "COMPLETED",
] as const;

const ACTION_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export class CommandsQueryMeterJobValidator {
  validateResponse(body: QueryMeterJobResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.message).toBeTruthy();
  }

  validateErrorResponse(body: QueryMeterJobResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateNotFoundResponse(body: QueryMeterJobResponse): void {
    this.validateErrorResponse(body);
  }

  validateJobNameEcho(mapped: MappedQueryMeterJobData, requestedJobName: string): void {
    expect(mapped.job.jobName).toBe(requestedJobName.trim());
  }

  validateSyncFlags(mapped: MappedQueryMeterJobData): void {
    expect(typeof mapped.job.synced).toBe("boolean");
    expect(typeof mapped.job.autoSynced).toBe("boolean");
  }

  validateHesJobStatus(mapped: MappedQueryMeterJobData): void {
    if (mapped.job.hesJobStatus !== null) {
      expect(mapped.job.hesJobStatus.trim().length).toBeGreaterThan(0);
    }
  }

  validateHesStatusCode(mapped: MappedQueryMeterJobData): void {
    expect(Number.isInteger(mapped.job.hesStatusCode)).toBe(true);
    expect(mapped.job.hesStatusCode).toBeGreaterThanOrEqual(0);
  }

  /** Backend summarizeLogsByJobPrefix: counts grouped by status sum to requested total. */
  validateSummaryCounts(summary: QueryMeterJobSummary): void {
    for (const value of [
      summary.requested,
      summary.successful,
      summary.failed,
      summary.inProgress,
      summary.rejected,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }

    expect(summary.requested).toBe(
      summary.successful +
        summary.failed +
        summary.inProgress +
        summary.rejected,
    );
  }

  validateSummaryMatchesMeterResults(
    summary: QueryMeterJobSummary,
    meterResults: QueryMeterJobMeterResult[],
  ): void {
    expect(meterResults.length).toBeLessThanOrEqual(summary.requested);
    if (summary.requested > 0) {
      expect(meterResults.length).toBeGreaterThan(0);
    }
  }

  validateMeterResultsPresent(meterResults: QueryMeterJobMeterResult[]): void {
    expect(Array.isArray(meterResults)).toBe(true);
    expect(meterResults.length).toBeGreaterThan(0);
  }

  validateMeterId(row: QueryMeterJobMeterResult): void {
    expect(row.meterId).toBeTruthy();
    expect(row.meterId).toBe(row.meterId.trim());
    expect(/^\d+$/.test(row.meterId)).toBe(true);
  }

  validateAction(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBeTruthy();
    expect(ACTION_PATTERN.test(row.action)).toBe(true);
  }

  validateMeterStatus(row: QueryMeterJobMeterResult): void {
    expect(row.status).toBeTruthy();
    expect(METER_JOB_STATUSES).toContain(row.status);
  }

  validateRowHesStatusCode(row: QueryMeterJobMeterResult): void {
    expect(Number.isInteger(row.hesStatusCode)).toBe(true);
    expect(row.hesStatusCode).toBeGreaterThanOrEqual(0);
  }

  /** FAILED rows from hes_command_logs should carry error context when HES rejects. */
  validateFailedRowRules(row: QueryMeterJobMeterResult): void {
    if (row.status !== "FAILED") {
      return;
    }
    if (row.hesStatusCode >= 400) {
      expect(row.errorMessage).toBeTruthy();
      expect(row.errorMessage!.trim().length).toBeGreaterThan(0);
    }
  }

  validateHesResponseShape(row: QueryMeterJobMeterResult): void {
    if (!row.hesResponse) {
      return;
    }
    if (row.hesResponse.message !== undefined) {
      expect(typeof row.hesResponse.message).toBe("string");
      expect(row.hesResponse.message.trim().length).toBeGreaterThan(0);
    }
    if (row.hesResponse.status !== undefined) {
      expect(Number.isInteger(row.hesResponse.status)).toBe(true);
      expect(row.hesResponse.status!).toBeGreaterThanOrEqual(100);
      expect(row.hesResponse.status!).toBeLessThan(600);
    }
  }

  validateStatusSummaryAlignment(
    summary: QueryMeterJobSummary,
    meterResults: QueryMeterJobMeterResult[],
  ): void {
    const failedRows = meterResults.filter((r) => r.status === "FAILED").length;
    const successRows = meterResults.filter((r) => r.status === "SUCCESS").length;
    const inProgressRows = meterResults.filter(
      (r) => r.status === "IN_PROGRESS" || r.status === "PENDING",
    ).length;
    const rejectedRows = meterResults.filter((r) => r.status === "REJECTED").length;

    expect(failedRows).toBeLessThanOrEqual(summary.failed);
    expect(successRows).toBeLessThanOrEqual(summary.successful);
    expect(inProgressRows).toBeLessThanOrEqual(summary.inProgress);
    expect(rejectedRows).toBeLessThanOrEqual(summary.rejected);
  }

  validateHesUnreachableMessage(mapped: MappedQueryMeterJobData): void {
    if (!/hes unreachable/i.test(mapped.message)) {
      return;
    }
    expect(mapped.job.synced).toBe(false);
  }

  validateExpectedMeterPresent(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const ids = meterResults.map((r) => r.meterId);
    expect(ids).toContain(expectedMeterId.trim());
  }

  validateMeterResultRow(row: QueryMeterJobMeterResult): void {
    this.validateMeterId(row);
    this.validateAction(row);
    this.validateMeterStatus(row);
    this.validateRowHesStatusCode(row);
    this.validateFailedRowRules(row);
    this.validateHesResponseShape(row);
  }

  validateAllMeterResults(meterResults: QueryMeterJobMeterResult[]): void {
    const seen = new Set<string>();
    for (const row of meterResults) {
      this.validateMeterResultRow(row);
      const key = `${row.meterId}-${row.action}`;
      expect(seen.has(key), `Duplicate meter/action row: ${key}`).toBe(false);
      seen.add(key);
    }
  }

  validateFullContract(
    mapped: MappedQueryMeterJobData,
    requestedJobName: string,
    expectedMeterId?: string,
  ): void {
    this.validateJobNameEcho(mapped, requestedJobName);
    this.validateSyncFlags(mapped);
    this.validateHesJobStatus(mapped);
    this.validateHesStatusCode(mapped);
    this.validateSummaryCounts(mapped.job.summary);
    this.validateSummaryMatchesMeterResults(
      mapped.job.summary,
      mapped.job.meterResults,
    );
    this.validateMeterResultsPresent(mapped.job.meterResults);
    this.validateAllMeterResults(mapped.job.meterResults);
    this.validateStatusSummaryAlignment(
      mapped.job.summary,
      mapped.job.meterResults,
    );
    this.validateHesUnreachableMessage(mapped);
    if (expectedMeterId) {
      this.validateExpectedMeterPresent(mapped.job.meterResults, expectedMeterId);
    }
  }
}
