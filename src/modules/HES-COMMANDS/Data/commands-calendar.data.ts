/** GET /indore/commands/calendar?from=&to= — working/holiday calendar (not tariff). */

export const commandsCalendarData = {
  defaultFrom: "2026-01-01",
  defaultTo: "2026-12-31",
  expectedTimezone: "Asia/Kolkata",
  maxResponseTimeMs: 60_000,
  dayTypes: ["HOLIDAY", "SPECIAL_WORKING_DAY", "FALLBACK_WORKING"] as const,
  windowDaySources: ["fallback", "calendar", "override"] as const,
  windowCodes: [
    "DISCONNECT_WINDOW_OPEN",
    "DISCONNECT_WINDOW_CLOSED",
    "DISCONNECT_WINDOW_OUTSIDE",
  ] as const,
  datePattern: /^\d{4}-\d{2}-\d{2}$/,
  timePattern: /^\d{2}:\d{2}$/,
  /** e.g. 2026-09-23T16:03:06+05:30 */
  retryDeadlinePattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
} as const;

/** Root keys on GET calendar `data`. */
export const EXPECTED_COMMANDS_CALENDAR_ROOT_KEYS = ["timezone", "from", "to", "entries"] as const;

/** Column headers for each calendar entry row. */
export const EXPECTED_COMMANDS_CALENDAR_ENTRY_COLUMNS = [
  "date",
  "dayType",
  "windowStart",
  "windowEnd",
  "description",
] as const;

/** Root keys on GET calendar/window `data`. */
export const EXPECTED_COMMANDS_CALENDAR_WINDOW_ROOT_KEYS = [
  "timezone",
  "windowStart",
  "windowEnd",
  "workingDate",
  "day",
  "code",
  "accepted",
  "retryDeadline",
  "nextEligibleWorkingDate",
  "message",
  "calendarOverride",
  "dailyQuota",
] as const;

export const EXPECTED_COMMANDS_CALENDAR_WINDOW_DAY_COLUMNS = [
  "date",
  "dayType",
  "isWorkingDay",
  "windowStart",
  "windowEnd",
  "description",
  "source",
] as const;

export const EXPECTED_COMMANDS_CALENDAR_WINDOW_QUOTA_COLUMNS = [
  "date",
  "limit",
  "used",
  "remaining",
  "timezone",
  "disconnectedMeters",
  "successfulDisconnectAttempts",
  "uniqueDisconnectMeters",
] as const;

export const CALENDAR_PATH = "/indore/commands/calendar";
export const CALENDAR_WINDOW_PATH = "/indore/commands/calendar/window";

export interface CommandsCalendarQuery {
  from?: string;
  to?: string;
}

export function buildCommandsCalendarPath(query: CommandsCalendarQuery = {}): string {
  const from = query.from ?? commandsCalendarData.defaultFrom;
  const to = query.to ?? commandsCalendarData.defaultTo;
  const params = new URLSearchParams({ from, to });
  return `${CALENDAR_PATH}?${params.toString()}`;
}
