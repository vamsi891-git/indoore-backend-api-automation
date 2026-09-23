import { expect } from "@playwright/test";
import {
  TariffCalendarEntry,
  TariffDay,
  TariffSeason,
  TariffWeek,
  commandsTariffData,
} from "../Data/commands-tariff.data";
import {
  CommandJobInitResponse,
  MappedCommandJobInitData,
} from "../shared/commands-job-init.mapper";
import { QueryMeterJobMeterResult } from "../Mapper/commands-query-meter-job.mapper";
import { QUERY_FINISHED_MESSAGE } from "../utils/commands-job-e2e.helper";

export type {
  TariffCalendarEntry,
  TariffDay,
  TariffSeason,
  TariffWeek,
  TariffScheduleSlot,
  TariffSeasonStart,
} from "../Data/commands-tariff.data";

export class CommandsTariffValidator {
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

  validateInitMessage(mapped: MappedCommandJobInitData): void {
    expect(commandsTariffData.initMessagePattern.test(mapped.message)).toBe(true);
    expect(/hes callback/i.test(mapped.message)).toBe(true);
  }

  validateInitNote(mapped: MappedCommandJobInitData): void {
    expect(mapped.init.note).toBeDefined();
    expect(commandsTariffData.hesCallbackNotePattern.test(mapped.init.note!)).toBe(true);
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

  validateQueryFinishedMessage(message: string): void {
    expect(QUERY_FINISHED_MESSAGE.test(message)).toBe(true);
  }

  validateTariffSeason(season: TariffSeason): void {
    expect(Number.isInteger(season.week)).toBe(true);
    expect(season.week).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(season.start.dayOfMonth)).toBe(true);
    expect(season.start.dayOfMonth).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(season.start.month)).toBe(true);
    expect(season.start.month).toBeGreaterThanOrEqual(1);
    expect(season.start.month).toBeLessThanOrEqual(12);
  }

  validateTariffWeek(week: TariffWeek): void {
    expect(Array.isArray(week.days)).toBe(true);
    expect(week.days.length).toBe(7);
    for (const day of week.days) {
      expect(Number.isInteger(day)).toBe(true);
      expect(day).toBeGreaterThanOrEqual(0);
    }
  }

  validateTariffDay(day: TariffDay): void {
    expect(Array.isArray(day.schedule)).toBe(true);
    expect(day.schedule.length).toBeGreaterThan(0);
    for (const slot of day.schedule) {
      expect(commandsTariffData.scheduleTimePattern.test(slot.time)).toBe(true);
      expect(Number.isInteger(slot.zone)).toBe(true);
      expect(slot.zone).toBeGreaterThanOrEqual(0);
    }
  }

  validateTariffCalendarEntry(entry: TariffCalendarEntry): void {
    expect(entry.type).toBe(commandsTariffData.expectedHesResponseType);
    expect(typeof entry.active).toBe("boolean");
    expect(Array.isArray(entry.seasons)).toBe(true);
    expect(entry.seasons.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.weeks)).toBe(true);
    expect(entry.weeks.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.days)).toBe(true);
    expect(entry.days.length).toBeGreaterThan(0);

    for (const season of entry.seasons) {
      this.validateTariffSeason(season);
    }
    for (const week of entry.weeks) {
      this.validateTariffWeek(week);
    }
    for (const day of entry.days) {
      this.validateTariffDay(day);
    }
  }

  parseMeterResponseCalendar(meterResponse: string | null | undefined): TariffCalendarEntry | null {
    if (!meterResponse?.trim()) return null;
    try {
      const parsed = JSON.parse(meterResponse) as TariffCalendarEntry;
      if (parsed?.type !== commandsTariffData.expectedHesResponseType) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  isTransientMeterFailure(row: QueryMeterJobMeterResult): boolean {
    const detail = `${row.errorMessage ?? ""} ${row.message ?? ""} ${row.reason ?? ""}`;
    return commandsTariffData.transientMeterFailurePattern.test(detail);
  }

  validateTariffFailedSetMeterResultRow(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
  ): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.status).toBe("FAILED");
    expect(row.action).toBe(commandsTariffData.expectedSetAction);
    const detail = row.errorMessage ?? row.message ?? row.reason ?? "";
    expect(detail.trim().length).toBeGreaterThan(0);
  }

  validateTariffMeterResultRow(
    row: QueryMeterJobMeterResult,
    expectedMeterId: string,
    mode: "get" | "set" = "get",
  ): void {
    expect(row.meterId).toBe(expectedMeterId);
    expect(row.action).toBe(
      mode === "set" ? commandsTariffData.expectedSetAction : commandsTariffData.expectedGetAction,
    );
    expect(row.status).toBe("SUCCESS");
    expect(row.hesStatusCode).toBe(200);
    expect(row.errorMessage ?? null).toBeNull();
    expect(row.message).toBeTruthy();
    expect(
      (mode === "set"
        ? commandsTariffData.querySetSuccessMessagePattern
        : commandsTariffData.queryGetSuccessMessagePattern
      ).test(row.message!),
    ).toBe(true);

    expect(Array.isArray(row.meterResponseRows)).toBe(true);

    if (mode === "set") {
      if (row.hesResponse) {
        const hes = row.hesResponse as Record<string, unknown>;
        if (hes.meterId != null) {
          expect(String(hes.meterId)).toBe(expectedMeterId);
        }
        if (hes.status != null) {
          expect(String(hes.status).toUpperCase()).toBe("SUCCESS");
        }
        const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
        if (meta?.commandApiType != null) {
          expect(String(meta.commandApiType)).toBe("tariff_calendar_set");
        }
      }
      return;
    }

    expect(row.hesResponse).toBeDefined();
    const hes = row.hesResponse as Record<string, unknown>;
    expect(hes.meterId).toBe(expectedMeterId);
    expect(hes.status).toBe("SUCCESS");
    expect(hes.failureStep).toBe("0");
    expect(Array.isArray(hes.response)).toBe(true);

    const entries = hes.response as TariffCalendarEntry[];
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      this.validateTariffCalendarEntry(entry);
    }

    const meta = hes.__mdmsMeta as Record<string, unknown> | undefined;
    if (meta?.commandApiType != null) {
      expect(String(meta.commandApiType)).toBe("tariff_calendar_get");
    }

    const fromDisplay = this.parseMeterResponseCalendar(row.meterResponse);
    expect(fromDisplay, "meterResponse should be TARIFF_CALENDAR JSON").toBeTruthy();
    this.validateTariffCalendarEntry(fromDisplay!);
    expect(fromDisplay!.type).toBe(entries[0].type);
    expect(fromDisplay!.active).toBe(entries[0].active);
    expect(fromDisplay!.seasons.length).toBe(entries[0].seasons.length);
  }

  validateTariffQueryMeterResults(
    meterResults: QueryMeterJobMeterResult[],
    expectedMeterId: string,
    mode: "get" | "set" = "get",
  ): void {
    const row = meterResults.find((r) => r.meterId === expectedMeterId.trim());
    expect(row, `Expected meter ${expectedMeterId} in query results`).toBeDefined();
    this.validateTariffMeterResultRow(row!, expectedMeterId, mode);
  }
}
