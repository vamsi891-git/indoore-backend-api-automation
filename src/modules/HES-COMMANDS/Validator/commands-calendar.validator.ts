import { expect } from "@playwright/test";
import {
  EXPECTED_COMMANDS_CALENDAR_ENTRY_COLUMNS,
  EXPECTED_COMMANDS_CALENDAR_ROOT_KEYS,
  EXPECTED_COMMANDS_CALENDAR_WINDOW_DAY_COLUMNS,
  EXPECTED_COMMANDS_CALENDAR_WINDOW_QUOTA_COLUMNS,
  EXPECTED_COMMANDS_CALENDAR_WINDOW_ROOT_KEYS,
  commandsCalendarData,
} from "../Data/commands-calendar.data";
import {
  CalendarWindowDailyQuota,
  CalendarWindowDay,
  CommandsCalendarEntry,
  CommandsCalendarResponse,
  CommandsCalendarWindowResponse,
  MappedCommandsCalendarData,
  MappedCommandsCalendarWindowData,
} from "../Mapper/commands-calendar.mapper";

export class CommandsCalendarValidator {
  validateResponse(body: CommandsCalendarResponse | CommandsCalendarWindowResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: CommandsCalendarResponse | CommandsCalendarWindowResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateRootKeys(data: object): void {
    expect(Object.keys(data).sort()).toEqual([...EXPECTED_COMMANDS_CALENDAR_ROOT_KEYS].sort());
  }

  validateRangeEcho(
    mapped: MappedCommandsCalendarData,
    requestedFrom: string,
    requestedTo: string,
  ): void {
    expect(mapped.from).toBe(requestedFrom);
    expect(mapped.to).toBe(requestedTo);
    expect(commandsCalendarData.datePattern.test(mapped.from)).toBe(true);
    expect(commandsCalendarData.datePattern.test(mapped.to)).toBe(true);
    expect(mapped.from <= mapped.to).toBe(true);
  }

  validateTimezone(mapped: MappedCommandsCalendarData): void {
    expect(mapped.timezone).toBeTruthy();
    expect(mapped.timezone).toBe(commandsCalendarData.expectedTimezone);
  }

  validateEntryKeys(entry: object): void {
    expect(Object.keys(entry).sort()).toEqual([...EXPECTED_COMMANDS_CALENDAR_ENTRY_COLUMNS].sort());
  }

  validateEntry(entry: CommandsCalendarEntry): void {
    expect(commandsCalendarData.datePattern.test(entry.date)).toBe(true);
    expect(entry.dayType.trim().length).toBeGreaterThan(0);
    expect(
      commandsCalendarData.dayTypes.includes(
        entry.dayType as (typeof commandsCalendarData.dayTypes)[number],
      ) || /^[A-Z][A-Z0-9_]*$/.test(entry.dayType),
    ).toBe(true);
    expect(entry.description.trim().length).toBeGreaterThan(0);

    if (entry.dayType === "HOLIDAY") {
      expect(entry.windowStart).toBeNull();
      expect(entry.windowEnd).toBeNull();
    } else if (entry.dayType === "SPECIAL_WORKING_DAY") {
      expect(entry.windowStart).toBeTruthy();
      expect(entry.windowEnd).toBeTruthy();
      expect(commandsCalendarData.timePattern.test(entry.windowStart!)).toBe(true);
      expect(commandsCalendarData.timePattern.test(entry.windowEnd!)).toBe(true);
      expect(entry.windowStart! <= entry.windowEnd!).toBe(true);
    } else {
      if (entry.windowStart != null) {
        expect(commandsCalendarData.timePattern.test(entry.windowStart)).toBe(true);
      }
      if (entry.windowEnd != null) {
        expect(commandsCalendarData.timePattern.test(entry.windowEnd)).toBe(true);
      }
    }
  }

  validateEntriesInRange(mapped: MappedCommandsCalendarData): void {
    for (const entry of mapped.entries) {
      expect(entry.date >= mapped.from).toBe(true);
      expect(entry.date <= mapped.to).toBe(true);
    }
  }

  validateEntriesSorted(mapped: MappedCommandsCalendarData): void {
    for (let i = 1; i < mapped.entries.length; i++) {
      expect(mapped.entries[i - 1].date <= mapped.entries[i].date).toBe(true);
    }
  }

  validateAllEntries(mapped: MappedCommandsCalendarData, rawEntries?: object[]): void {
    expect(Array.isArray(mapped.entries)).toBe(true);
    if (rawEntries) {
      expect(rawEntries.length).toBe(mapped.entries.length);
      for (const raw of rawEntries) {
        this.validateEntryKeys(raw);
      }
    }
    for (const entry of mapped.entries) {
      this.validateEntry(entry);
    }
    this.validateEntriesInRange(mapped);
    this.validateEntriesSorted(mapped);
  }

  validateFullCalendar(
    mapped: MappedCommandsCalendarData,
    requestedFrom: string,
    requestedTo: string,
    rawData?: object,
  ): void {
    if (rawData) {
      this.validateRootKeys(rawData);
    }
    this.validateTimezone(mapped);
    this.validateRangeEcho(mapped, requestedFrom, requestedTo);
    this.validateAllEntries(
      mapped,
      rawData && "entries" in rawData
        ? ((rawData as { entries: object[] }).entries ?? [])
        : undefined,
    );
  }

  // ─── calendar/window ─────────────────────────────────────────────────────

  validateWindowRootKeys(data: object): void {
    expect(Object.keys(data).sort()).toEqual(
      [...EXPECTED_COMMANDS_CALENDAR_WINDOW_ROOT_KEYS].sort(),
    );
  }

  validateWindowDayKeys(day: object): void {
    expect(Object.keys(day).sort()).toEqual(
      [...EXPECTED_COMMANDS_CALENDAR_WINDOW_DAY_COLUMNS].sort(),
    );
  }

  validateWindowQuotaKeys(quota: object): void {
    expect(Object.keys(quota).sort()).toEqual(
      [...EXPECTED_COMMANDS_CALENDAR_WINDOW_QUOTA_COLUMNS].sort(),
    );
  }

  validateWindowDay(day: CalendarWindowDay, workingDate: string): void {
    expect(day.date).toBe(workingDate);
    expect(commandsCalendarData.datePattern.test(day.date)).toBe(true);
    expect(day.dayType.trim().length).toBeGreaterThan(0);
    expect(
      commandsCalendarData.dayTypes.includes(
        day.dayType as (typeof commandsCalendarData.dayTypes)[number],
      ) || /^[A-Z][A-Z0-9_]*$/.test(day.dayType),
    ).toBe(true);
    expect(typeof day.isWorkingDay).toBe("boolean");
    expect(day.source.trim().length).toBeGreaterThan(0);
    expect(
      commandsCalendarData.windowDaySources.includes(
        day.source as (typeof commandsCalendarData.windowDaySources)[number],
      ) || /^[a-z][a-z0-9_]*$/i.test(day.source),
    ).toBe(true);

    if (day.windowStart != null) {
      expect(commandsCalendarData.timePattern.test(day.windowStart)).toBe(true);
    }
    if (day.windowEnd != null) {
      expect(commandsCalendarData.timePattern.test(day.windowEnd)).toBe(true);
    }
    if (day.windowStart != null && day.windowEnd != null) {
      expect(day.windowStart <= day.windowEnd).toBe(true);
    }
  }

  validateWindowDailyQuota(quota: CalendarWindowDailyQuota): void {
    expect(commandsCalendarData.datePattern.test(quota.date)).toBe(true);
    expect(quota.timezone).toBe(commandsCalendarData.expectedTimezone);
    for (const value of [
      quota.limit,
      quota.used,
      quota.remaining,
      quota.disconnectedMeters,
      quota.successfulDisconnectAttempts,
      quota.uniqueDisconnectMeters,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
    expect(quota.used + quota.remaining).toBe(quota.limit);
  }

  validateWindowContract(mapped: MappedCommandsCalendarWindowData, rawData?: object): void {
    if (rawData) {
      this.validateWindowRootKeys(rawData);
      if ("day" in rawData && rawData.day && typeof rawData.day === "object") {
        this.validateWindowDayKeys(rawData.day as object);
      }
      if ("dailyQuota" in rawData && rawData.dailyQuota && typeof rawData.dailyQuota === "object") {
        this.validateWindowQuotaKeys(rawData.dailyQuota as object);
      }
    }

    expect(mapped.timezone).toBe(commandsCalendarData.expectedTimezone);
    expect(commandsCalendarData.timePattern.test(mapped.windowStart)).toBe(true);
    expect(commandsCalendarData.timePattern.test(mapped.windowEnd)).toBe(true);
    expect(mapped.windowStart <= mapped.windowEnd).toBe(true);
    expect(commandsCalendarData.datePattern.test(mapped.workingDate)).toBe(true);

    expect(mapped.code.trim().length).toBeGreaterThan(0);
    expect(
      commandsCalendarData.windowCodes.includes(
        mapped.code as (typeof commandsCalendarData.windowCodes)[number],
      ) || /^[A-Z][A-Z0-9_]*$/.test(mapped.code),
    ).toBe(true);
    expect(typeof mapped.accepted).toBe("boolean");
    expect(typeof mapped.calendarOverride).toBe("boolean");
    expect(mapped.message.trim().length).toBeGreaterThan(0);

    if (mapped.retryDeadline != null) {
      expect(commandsCalendarData.retryDeadlinePattern.test(mapped.retryDeadline)).toBe(true);
    }
    if (mapped.nextEligibleWorkingDate != null) {
      expect(commandsCalendarData.datePattern.test(mapped.nextEligibleWorkingDate)).toBe(true);
    }

    this.validateWindowDay(mapped.day, mapped.workingDate);
    expect(mapped.day.windowStart).toBe(mapped.windowStart);
    expect(mapped.day.windowEnd).toBe(mapped.windowEnd);
    this.validateWindowDailyQuota(mapped.dailyQuota);
    expect(mapped.dailyQuota.date).toBe(mapped.workingDate);

    if (mapped.accepted) {
      expect(mapped.code).toMatch(/OPEN|BYPASS|ALLOWED|OVERRIDE/i);
    }
  }
}
