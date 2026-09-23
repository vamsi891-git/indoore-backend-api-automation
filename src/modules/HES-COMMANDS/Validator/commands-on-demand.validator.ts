import { expect } from "@playwright/test";
import { commandsOnDemandData } from "../Data/commands-on-demand.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";
import {
  MappedQueryMeterJobData,
  QueryMeterJobMeterResult,
} from "../Mapper/commands-query-meter-job.mapper";

export class CommandsOnDemandValidator {
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
  }

  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(commandsOnDemandData.initMessagePattern.test(mapped.message)).toBe(true);
  }

  /** Live sample: SUCCESS on init (not IN_PROGRESS), timings still null. */
  validateInitSuccessStatus(mapped: MappedCommandJobInitData): void {
    for (const row of mapped.init.meterResults) {
      expect(row.status).toBe("SUCCESS");
      expect(row.hesStatusCode).toBe(200);
      expect(row.errorMessage ?? null).toBeNull();
      expect(/^\d+$/.test(row.jobName)).toBe(true);
    }
  }

  validateInitAsyncTimings(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.commandExecutionTimeMs).toBeNull();
    expect(mapped.init.meterResponseTimeMs).toBeNull();
  }

  validateQueryMessage(message: string): void {
    expect(commandsOnDemandData.queryMessagePattern.test(message)).toBe(true);
  }

  isHesUnreachable(mapped: MappedQueryMeterJobData): boolean {
    return commandsOnDemandData.hesUnreachableMessagePattern.test(mapped.message);
  }

  validateOnDemandMeterResultRow(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
    requestEcho?: {
      formattedProfileObisCode: string;
      sampleStartTime: string;
      sampleStopTime: string;
    },
  ): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.status).toBe("SUCCESS");
    expect(row.action).toBe(commandsOnDemandData.expectedAction);
    expect(Number.isInteger(row.hesStatusCode)).toBe(true);
    expect(row.message).toBeTruthy();
    expect(commandsOnDemandData.initMessagePattern.test(row.message!)).toBe(true);

    // Empty samples / null meterResponse is valid for a range with no profile data.
    expect(row.meterResponse ?? null).toBeNull();
    expect(Array.isArray(row.meterResponseRows)).toBe(true);

    if (row.hesResponse) {
      const hes = row.hesResponse as Record<string, unknown>;
      if (hes.samples !== undefined) {
        expect(Array.isArray(hes.samples)).toBe(true);
      }
      const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
      if (meta?.commandApiType != null) {
        expect(String(meta.commandApiType)).toBe(commandsOnDemandData.defaultType);
      }
      const commandData = meta?.commandData as Record<string, unknown> | undefined;
      if (commandData && requestEcho) {
        if (commandData.formattedProfileObisCode != null) {
          expect(String(commandData.formattedProfileObisCode)).toBe(
            requestEcho.formattedProfileObisCode,
          );
        }
        if (commandData.sampleStartTime != null) {
          expect(String(commandData.sampleStartTime)).toBe(requestEcho.sampleStartTime);
        }
        if (commandData.sampleStopTime != null) {
          expect(String(commandData.sampleStopTime)).toBe(requestEcho.sampleStopTime);
        }
      }
    }
  }

  validateOnDemandQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
    requestEcho?: {
      formattedProfileObisCode: string;
      sampleStartTime: string;
      sampleStopTime: string;
    },
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateOnDemandMeterResultRow(row!, expectedMeterId, requestEcho);
  }

  /** HES unreachable: synced false, hesJobStatus null, 404 — still SUCCESS meter row from DB. */
  validateHesUnreachableQuery(mapped: MappedQueryMeterJobData): void {
    expect(this.isHesUnreachable(mapped)).toBe(true);
    expect(mapped.job.synced).toBe(false);
    expect(mapped.job.autoSynced).toBe(false);
    expect(mapped.job.hesJobStatus).toBeNull();
    expect(mapped.job.hesStatusCode).toBe(404);
  }
}
