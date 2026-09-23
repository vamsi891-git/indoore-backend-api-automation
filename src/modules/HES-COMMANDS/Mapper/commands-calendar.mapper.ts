export type CalendarDayType = "HOLIDAY" | "SPECIAL_WORKING_DAY" | "FALLBACK_WORKING" | string;

export interface CommandsCalendarEntry {
  date: string;
  dayType: CalendarDayType;
  windowStart: string | null;
  windowEnd: string | null;
  description: string;
}

export interface CommandsCalendarData {
  timezone: string;
  from: string;
  to: string;
  entries: CommandsCalendarEntry[];
}

export interface CommandsCalendarResponse {
  success: boolean;
  data?: CommandsCalendarData;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface MappedCommandsCalendarData {
  timezone: string;
  from: string;
  to: string;
  entries: CommandsCalendarEntry[];
}

export interface CalendarWindowDay {
  date: string;
  dayType: CalendarDayType;
  isWorkingDay: boolean;
  windowStart: string | null;
  windowEnd: string | null;
  description: string | null;
  source: string;
}

export interface CalendarWindowDailyQuota {
  date: string;
  limit: number;
  used: number;
  remaining: number;
  timezone: string;
  disconnectedMeters: number;
  successfulDisconnectAttempts: number;
  uniqueDisconnectMeters: number;
}

export interface CommandsCalendarWindowData {
  timezone: string;
  windowStart: string;
  windowEnd: string;
  workingDate: string;
  day: CalendarWindowDay;
  code: string;
  accepted: boolean;
  retryDeadline: string | null;
  nextEligibleWorkingDate: string | null;
  message: string;
  calendarOverride: boolean;
  dailyQuota: CalendarWindowDailyQuota;
}

export interface CommandsCalendarWindowResponse {
  success: boolean;
  data?: CommandsCalendarWindowData;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface MappedCommandsCalendarWindowData {
  timezone: string;
  windowStart: string;
  windowEnd: string;
  workingDate: string;
  day: CalendarWindowDay;
  code: string;
  accepted: boolean;
  retryDeadline: string | null;
  nextEligibleWorkingDate: string | null;
  message: string;
  calendarOverride: boolean;
  dailyQuota: CalendarWindowDailyQuota;
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class CommandsCalendarMapper {
  static mapResponse(body: CommandsCalendarResponse): MappedCommandsCalendarData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful commands calendar response");
    }

    const { data } = body;
    return {
      timezone: String(data.timezone ?? "").trim(),
      from: String(data.from ?? "").trim(),
      to: String(data.to ?? "").trim(),
      entries: (data.entries ?? []).map((entry) => ({
        date: String(entry.date ?? "").trim(),
        dayType: String(entry.dayType ?? "").trim(),
        windowStart: trimOrNull(entry.windowStart),
        windowEnd: trimOrNull(entry.windowEnd),
        description: String(entry.description ?? "").trim(),
      })),
    };
  }

  static mapWindowResponse(body: CommandsCalendarWindowResponse): MappedCommandsCalendarWindowData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful commands calendar/window response");
    }

    const { data } = body;
    const day = data.day;
    const quota = data.dailyQuota;

    return {
      timezone: String(data.timezone ?? "").trim(),
      windowStart: String(data.windowStart ?? "").trim(),
      windowEnd: String(data.windowEnd ?? "").trim(),
      workingDate: String(data.workingDate ?? "").trim(),
      day: {
        date: String(day?.date ?? "").trim(),
        dayType: String(day?.dayType ?? "").trim(),
        isWorkingDay: Boolean(day?.isWorkingDay),
        windowStart: trimOrNull(day?.windowStart),
        windowEnd: trimOrNull(day?.windowEnd),
        description: trimOrNull(day?.description),
        source: String(day?.source ?? "").trim(),
      },
      code: String(data.code ?? "").trim(),
      accepted: Boolean(data.accepted),
      retryDeadline: trimOrNull(data.retryDeadline),
      nextEligibleWorkingDate: trimOrNull(data.nextEligibleWorkingDate),
      message: String(data.message ?? "").trim(),
      calendarOverride: Boolean(data.calendarOverride),
      dailyQuota: {
        date: String(quota?.date ?? "").trim(),
        limit: Number(quota?.limit),
        used: Number(quota?.used),
        remaining: Number(quota?.remaining),
        timezone: String(quota?.timezone ?? "").trim(),
        disconnectedMeters: Number(quota?.disconnectedMeters),
        successfulDisconnectAttempts: Number(quota?.successfulDisconnectAttempts),
        uniqueDisconnectMeters: Number(quota?.uniqueDisconnectMeters),
      },
    };
  }
}
