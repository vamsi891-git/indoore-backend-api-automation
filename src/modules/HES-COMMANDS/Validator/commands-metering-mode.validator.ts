import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { MappedQueryMeterJobData } from "../Mapper/commands-query-meter-job.mapper";
import { commandsMeteringModeData } from "../Data/commands-metering-mode.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";

export class CommandsMeteringModeValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(commandsMeteringModeData.initMessagePattern.test(mapped.message)).toBe(
      true,
    );
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitNote(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.note).toBeDefined();
    expect(
      commandsMeteringModeData.hesCallbackNotePattern.test(mapped.init.note!),
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
    expect(
      commandsMeteringModeData.queryFinishedMessagePattern.test(message),
    ).toBe(true);
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

  validateHesResponseEnvelope(
    hes: Record<string, unknown>,
    expectedMeterId: string,
  ): void {
    expect(hes.meterId).toBe(expectedMeterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");
    expect(hes.progress).toBeNull();
    expect(hes).toHaveProperty("response");
    expect(hes.response).toBeNull();
  }

  validateMeteringModeMeterResultRow(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
  ): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.action).toBe(commandsMeteringModeData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();
    expect(row.hesResponse).toBeDefined();

    this.validateHesResponseEnvelope(
      row.hesResponse as Record<string, unknown>,
      expectedMeterId,
    );
  }

  validateMeteringModeQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateMeteringModeMeterResultRow(row!, expectedMeterId);
  }
}
