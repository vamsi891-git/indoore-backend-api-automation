import { expect } from "@playwright/test";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { commandsProfileConfigData } from "../Data/commands-profile-config.data";
import { MappedCommandJobInitData } from "../shared/commands-job-init.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

export interface ProfileCapturePeriodEntry {
  type: string;
  profileType: string;
  capturePeriod: number;
  active: boolean;
}

/** Display label patterns for meterResponseRows (e.g. Instantaneous, Block Load). */
const PROFILE_TYPE_LABEL_PATTERN: Record<
  (typeof commandsProfileConfigData.profileTypes)[number],
  RegExp
> = {
  INSTANTANEOUS: /instantaneous/i,
  BLOCK_LOAD: /block\s*load/i,
  DAILY_LOAD: /daily\s*load/i,
  BILLING: /^billing$/i,
};

const CAPTURE_PERIOD_DISPLAY = /^(\d+)s$/i;

export class CommandsProfileConfigValidator {
  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(/profile period/i.test(mapped.message)).toBe(true);
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

  validateProfileCapturePeriodEntry(entry: ProfileCapturePeriodEntry): void {
    expect(entry.type).toBe(commandsProfileConfigData.expectedHesResponseType);
    expect(entry.profileType.trim().length).toBeGreaterThan(0);
    expect(
      commandsProfileConfigData.profileTypes.includes(
        entry.profileType as (typeof commandsProfileConfigData.profileTypes)[number],
      ),
    ).toBe(true);
    expect(Number.isInteger(entry.capturePeriod)).toBe(true);
    expect(entry.capturePeriod).toBeGreaterThan(0);
    expect(typeof entry.active).toBe("boolean");
  }

  validateProfileCapturePeriodResponse(response: unknown[]): void {
    expect(response.length).toBeGreaterThan(0);

    const entries = response as ProfileCapturePeriodEntry[];
    const profileTypes = new Set<string>();

    for (const entry of entries) {
      this.validateProfileCapturePeriodEntry(entry);
      profileTypes.add(entry.profileType);
    }

    expect(profileTypes.size).toBe(entries.length);
  }

  validateDisplayRowsMatchEntries(
    rows: { label: string; value: string }[],
    entries: ProfileCapturePeriodEntry[],
  ): void {
    for (const entry of entries) {
      const labelPattern =
        PROFILE_TYPE_LABEL_PATTERN[
          entry.profileType as (typeof commandsProfileConfigData.profileTypes)[number]
        ];
      expect(labelPattern, `No label pattern for ${entry.profileType}`).toBeDefined();

      const display = rows.find((r) => labelPattern.test(r.label));
      expect(display, `Missing meterResponseRows label for ${entry.profileType}`).toBeDefined();

      const match = CAPTURE_PERIOD_DISPLAY.exec(display!.value.trim());
      expect(match, `Expected capture display like "900s", got "${display!.value}"`).toBeTruthy();
      expect(Number(match![1])).toBe(entry.capturePeriod);
    }
  }

  validateProfileConfigMeterResultRow(row: QueryMeterJobMeterResult): void {
    expect(row.action).toBe(commandsProfileConfigData.expectedInitAction);
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.hesResponse).toBeDefined();
    expect(row.message).toBeTruthy();
    expect(/profile period/i.test(row.message!)).toBe(true);
    expect(row.reason).toBeNull();

    expect(row.meterResponse).toBeTruthy();
    expect(row.meterResponseRows?.length).toBeGreaterThan(0);
    for (const item of row.meterResponseRows ?? []) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.value.length).toBeGreaterThan(0);
    }

    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(row.meterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");

    const response = hes.response;
    expect(Array.isArray(response)).toBe(true);
    this.validateProfileCapturePeriodResponse(response as unknown[]);

    const entries = (response as ProfileCapturePeriodEntry[]).filter(
      (item) => item.type === commandsProfileConfigData.expectedHesResponseType,
    );
    this.validateDisplayRowsMatchEntries(row.meterResponseRows ?? [], entries);

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    expect(meta).toBeDefined();
    expect(meta!.commandApiType).toBe("profile_capture_period_get");
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

  validateProfileConfigQueryMeterResults(
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
    this.validateProfileConfigMeterResultRow(row!);

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
