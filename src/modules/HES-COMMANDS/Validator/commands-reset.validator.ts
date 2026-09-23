import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { MappedQueryMeterJobData } from "../Mapper/commands-query-meter-job.mapper";
import { commandsResetData } from "../Data/commands-reset.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

export class CommandsResetValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(commandsResetData.initMessagePattern.test(mapped.message)).toBe(true);
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitNote(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.note).toBeDefined();
    expect(commandsResetData.hesCallbackNotePattern.test(mapped.init.note!)).toBe(true);
  }

  validateInitInProgressStatus(mapped: MappedCommandJobInitData): void {
    for (const row of mapped.init.meterResults) {
      expect(row.status).toBe("IN_PROGRESS");
      expect(row.hesStatusCode).toBe(200);
      expect(row.errorMessage ?? null).toBeNull();
    }
  }

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

  private validateResetActionAndMeta(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
    expectedHesStatus: "SUCCESS" | "FAILED",
  ): void {
    if (row.action) {
      expect(
        commandsResetData.expectedActions.includes(
          row.action as (typeof commandsResetData.expectedActions)[number],
        ) || /^[A-Z][A-Z0-9_]*$/.test(row.action),
      ).toBe(true);
    }

    if (row.hesResponse) {
      const hes = row.hesResponse as Record<string, unknown>;
      if (hes.meterId != null) {
        expect(String(hes.meterId)).toBe(expectedMeterId);
      }
      if (hes.status != null) {
        expect(String(hes.status).toUpperCase()).toBe(expectedHesStatus);
      }
      const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
      if (meta?.commandApiType != null) {
        expect(/max_demand_reset|lrcf_reset/i.test(String(meta.commandApiType))).toBe(true);
      }
    }
  }

  validateResetMeterResultRow(row: QueryMeterJobMeterResult, expectedMeterId: string): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();
    expect(row.message).toBeTruthy();
    expect(/reset/i.test(row.message!)).toBe(true);
    this.validateResetActionAndMeta(row, expectedMeterId, "SUCCESS");
  }

  /** FINISHED + FAILED from HES/meter (e.g. comms timeout) — shape only, not SUCCESS. */
  validateResetFailedMeterResultRow(row: QueryMeterJobMeterResult, expectedMeterId: string): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.status).toBe("FAILED");
    expect(row.hesStatusCode).toBe(200);
    const detail = row.errorMessage ?? row.message ?? row.reason ?? "";
    expect(detail.trim().length).toBeGreaterThan(0);
    this.validateResetActionAndMeta(row, expectedMeterId, "FAILED");
  }

  isTransientMeterFailure(row: QueryMeterJobMeterResult): boolean {
    const detail = `${row.errorMessage ?? ""} ${row.message ?? ""} ${row.reason ?? ""}`;
    return commandsResetData.transientMeterFailurePattern.test(detail);
  }

  validateResetQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateResetMeterResultRow(row!, expectedMeterId);
  }
}
