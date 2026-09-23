/** GET /indore/commands/disconnect/today-usage — daily disconnect quota. */

export const commandsDisconnectTodayUsageData = {
  expectedTimezone: "Asia/Kolkata",
  maxResponseTimeMs: 60_000,
  datePattern: /^\d{4}-\d{2}-\d{2}$/,
} as const;

/** Column headers for GET disconnect/today-usage `data`. */
export const EXPECTED_DISCONNECT_TODAY_USAGE_COLUMNS = [
  "date",
  "timezone",
  "limit",
  "used",
  "remaining",
  "disconnectedMeters",
  "successfulDisconnectAttempts",
  "uniqueDisconnectMeters",
] as const;

export const DISCONNECT_TODAY_USAGE_PATH = "/indore/commands/disconnect/today-usage";
