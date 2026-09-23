import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { MappedQueryMeterJobData } from "../Mapper/commands-query-meter-job.mapper";
import { commandsMeteringModeData } from "../Data/commands-metering-mode.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

export interface MeteringModeEntry {
  type: string;
  active: boolean;
  meteringMode: string;
}

export class CommandsMeteringModeValidator {
  validateInitMessage(mapped: MappedCommandJobInitData, forSet = false): void {
    const pattern = forSet
      ? commandsMeteringModeData.setInitMessagePattern
      : commandsMeteringModeData.initMessagePattern;
    expect(pattern.test(mapped.message)).toBe(true);
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitNote(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.note).toBeDefined();
    expect(commandsMeteringModeData.hesCallbackNotePattern.test(mapped.init.note!)).toBe(true);
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

  validateHesResponseEnvelope(hes: Record<string, unknown>, expectedMeterId: string): void {
    expect(hes.meterId).toBe(expectedMeterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");
    expect(hes.progress).toBeNull();
    expect(Array.isArray(hes.response)).toBe(true);
  }

  validateMeteringModeEntry(entry: MeteringModeEntry): void {
    expect(entry.type).toBe(commandsMeteringModeData.expectedHesResponseType);
    expect(typeof entry.active).toBe("boolean");
    expect(entry.meteringMode.trim().length).toBeGreaterThan(0);
    expect(
      commandsMeteringModeData.meteringModes.includes(
        entry.meteringMode as (typeof commandsMeteringModeData.meteringModes)[number],
      ),
    ).toBe(true);
  }

  validateDisplayRowsMatchEntry(
    rows: { label: string; value: string }[],
    entry: MeteringModeEntry,
  ): void {
    for (const label of commandsMeteringModeData.expectedDisplayLabels) {
      const row = rows.find((r) => r.label === label);
      expect(row, `Missing meterResponseRows label "${label}"`).toBeDefined();
      expect(row!.value.length).toBeGreaterThan(0);
    }

    const modeRow = rows.find((r) => r.label === "Metering Mode")!;
    const displayNormalized = modeRow.value.toUpperCase().replace(/[\s]+/g, "_");
    const displayMode =
      displayNormalized === "IMPORTEXPORT" || displayNormalized === "IMPORT_EXPORT"
        ? "IMPORT_EXPORT"
        : displayNormalized;
    expect(displayMode).toBe(entry.meteringMode.toUpperCase());
  }

  extractMeteringModeEntry(row: QueryMeterJobMeterResult): MeteringModeEntry {
    const hes = row.hesResponse as Record<string, unknown>;
    const entry = (hes.response as MeteringModeEntry[]).find(
      (e) => e.type === commandsMeteringModeData.expectedHesResponseType,
    );
    expect(entry).toBeDefined();
    return entry!;
  }

  validateMeteringModeMeterResultRow(row: QueryMeterJobMeterResult, expectedMeterId: string): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.action).toBe(commandsMeteringModeData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();
    expect(row.hesResponse).toBeDefined();
    expect(row.message).toBeTruthy();
    expect(/metering mode/i.test(row.message!)).toBe(true);
    expect(row.reason ?? null).toBeNull();

    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows?.length).toBeGreaterThan(0);
    for (const item of row.meterResponseRows ?? []) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
    }

    const hes = row.hesResponse as Record<string, unknown>;
    this.validateHesResponseEnvelope(hes, expectedMeterId);
    expect((hes.response as unknown[]).length).toBeGreaterThan(0);

    const entry = this.extractMeteringModeEntry(row);
    this.validateMeteringModeEntry(entry);
    this.validateDisplayRowsMatchEntry(row.meterResponseRows ?? [], entry);

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    expect(meta).toBeDefined();
    expect(meta!.commandApiType).toBe("metering_mode_get");
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

  validateMeteringModeQueryMeterResults(
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
    this.validateMeteringModeMeterResultRow(row!, expectedMeterId);

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
