import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type TariffCommandType = "tariff_calendar_get" | "tariff_calendar_set";

export interface TariffScheduleSlot {
  time: string;
  zone: number;
}

export interface TariffDay {
  schedule: TariffScheduleSlot[];
}

export interface TariffWeek {
  days: number[];
}

export interface TariffSeasonStart {
  dayOfMonth: number;
  month: number;
}

export interface TariffSeason {
  week: number;
  start: TariffSeasonStart;
}

export interface TariffCalendarEntry {
  type: string;
  active: boolean;
  seasons: TariffSeason[];
  weeks: TariffWeek[];
  days: TariffDay[];
}

export const commandsTariffData = {
  defaultType: "tariff_calendar_get" as TariffCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedGetAction: "GET_CONFIG",
  expectedSetAction: "SET_CONFIG",
  expectedInitAction: "GET_CONFIG",
  expectedHesResponseType: "TARIFF_CALENDAR",
  initMessagePattern: /tariff calendar/i,
  queryGetSuccessMessagePattern: /get tariff calendar completed successfully/i,
  querySetSuccessMessagePattern: /set tariff calendar completed successfully/i,
  querySuccessMessagePattern: /tariff calendar completed successfully/i,
  hesCallbackNotePattern: /final completion status will be delivered via hes callback/i,
  scheduleTimePattern: /^\d{2}:\d{2}$/,
  defaultActivationTime: "2026-09-01T00:30:00+05:30",
  /** Transient meter/HES failures — soft-find, do not fail smoke. */
  transientMeterFailurePattern:
    /no meter response from hes|comms timeout|meter busy|retry usually works/i,
} as const;

export const TARIFF_PATH = "/indore/commands/tariff";

export interface TariffRequestBody {
  type: TariffCommandType;
  meters: string | string[];
  otp?: string;
  activationTime?: string;
  commandData?: TariffCalendarEntry;
}

export function buildTariffGetBody(overrides: Partial<TariffRequestBody> = {}): TariffRequestBody {
  return {
    type: "tariff_calendar_get",
    meters: commandsTariffData.defaultMeterSerial,
    ...overrides,
  };
}

export function buildTariffSetBody(
  overrides: Partial<Omit<TariffRequestBody, "otp" | "commandData">> & {
    otp: string;
    commandData: TariffCalendarEntry;
  },
): TariffRequestBody {
  return {
    type: "tariff_calendar_set",
    meters: commandsTariffData.defaultMeterSerial,
    activationTime: commandsTariffData.defaultActivationTime,
    ...overrides,
  };
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}

export function summarizeTariffCalendar(calendar: TariffCalendarEntry): string {
  const firstZone = calendar.days[0]?.schedule[0]?.zone;
  return (
    `active=${calendar.active} seasons=${calendar.seasons.length} ` +
    `weeks=${calendar.weeks.length} days=${calendar.days.length}` +
    (firstZone != null ? ` firstZone=${firstZone}` : "")
  );
}

export function tariffCalendarsEqual(
  a: TariffCalendarEntry | null | undefined,
  b: TariffCalendarEntry | null | undefined,
): boolean {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function withAlternateFirstScheduleZone(calendar: TariffCalendarEntry): {
  target: TariffCalendarEntry;
  originalZone: number;
  targetZone: number;
} {
  const clone = JSON.parse(JSON.stringify(calendar)) as TariffCalendarEntry;
  const slot = clone.days[0]?.schedule[0];
  if (!slot) {
    throw new Error("Tariff calendar has no days[0].schedule[0] to mutate");
  }
  const originalZone = slot.zone;
  const targetZone = originalZone === 1 ? 2 : 1;
  slot.zone = targetZone;
  return { target: clone, originalZone, targetZone };
}
