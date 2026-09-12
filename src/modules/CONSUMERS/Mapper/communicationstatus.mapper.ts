export type CommunicationStatusScenario =
  | "status_with_date"
  | "status_default_today"
  | "status_dd_mm_yyyy"
  | "status_by_meter"
  | "invalid_date"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "contract_zero_intervals"
  | "contract_with_readings";

export interface CommunicationStatusErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface CommunicationIntervals {
  display: string;
  subtitle: string;
  receivedToday: number;
  expectedPerDay: number;
  /** Present only when percent > 0 */
  percent?: number;
  lastReadingToday?: string;
}

export interface CommunicationDelayed {
  display: string;
  subtitle: string;
  delaySeconds: number;
  lastSeen?: string;
  previousReading?: string;
}

export interface CommunicationStatusData {
  date: string;
  latestReadingDateTime?: string;
  intervals: CommunicationIntervals;
  delayed: CommunicationDelayed;
}

/** Live flat payload (selectedDate / receivedIntervals / …). */
export interface CommunicationStatusLiveFlat {
  selectedDate?: string;
  receivedIntervals?: number;
  totalIntervalsPerDay?: number;
  receivedPercentage?: number;
  delaySeconds?: number;
  lastCommunicationAt?: string | null;
  communicationState?: string;
  signalState?: string;
  intervalMinutes?: number;
  nextExpectedIntervalAt?: string | null;
  isDelayed?: boolean;
  isSeverelyDelayed?: boolean;
  canPing?: boolean;
  meterId?: string | null;
  [key: string]: unknown;
}

export interface CommunicationStatusResponse {
  success: boolean;
  data?: CommunicationStatusData | CommunicationStatusLiveFlat | null;
}

export interface MappedCommunicationStatus {
  success: boolean;
  data: CommunicationStatusData | null;
  date: string | null;
  intervals: CommunicationIntervals | null;
  delayed: CommunicationDelayed | null;
  latestReadingDateTime: string | null;
}

function formatDelayDisplay(delaySeconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, delaySeconds) / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Normalize live flat communication-status into the nested widget shape
 * used by validators / contract fixtures.
 */
export function normalizeCommunicationStatusData(
  raw: CommunicationStatusData | CommunicationStatusLiveFlat | null | undefined,
): CommunicationStatusData | null {
  if (raw == null) {
    return null;
  }

  const nested = raw as CommunicationStatusData;
  if (
    typeof nested.date === "string" &&
    nested.intervals &&
    nested.delayed
  ) {
    return nested;
  }

  const flat = raw as CommunicationStatusLiveFlat;
  const selectedDate = flat.selectedDate;
  if (typeof selectedDate !== "string" || !selectedDate.trim()) {
    return null;
  }

  const receivedToday = Number(flat.receivedIntervals ?? 0);
  const expectedPerDay = Number(flat.totalIntervalsPerDay ?? 96);
  const percentRaw = Number(flat.receivedPercentage ?? 0);
  const delaySeconds =
    flat.delaySeconds == null ? 0 : Number(flat.delaySeconds);
  const lastSeen =
    typeof flat.lastCommunicationAt === "string" && flat.lastCommunicationAt
      ? flat.lastCommunicationAt
      : undefined;

  const intervals: CommunicationIntervals = {
    display:
      percentRaw > 0
        ? `00:00 (${Math.min(100, Math.round(percentRaw))}%)`
        : "00:00 (0%)",
    subtitle: `Intervals (${receivedToday}/${expectedPerDay} Per Day)`,
    receivedToday,
    expectedPerDay,
  };
  if (percentRaw > 0) {
    intervals.percent = Math.min(100, Math.round(percentRaw));
  }
  if (lastSeen && receivedToday > 0) {
    intervals.lastReadingToday = lastSeen;
  }

  const delayed: CommunicationDelayed = {
    display: formatDelayDisplay(delaySeconds),
    subtitle: "Delayed",
    delaySeconds,
  };
  if (lastSeen) {
    delayed.lastSeen = lastSeen;
  }

  const data: CommunicationStatusData = {
    date: selectedDate,
    intervals,
    delayed,
  };
  if (lastSeen) {
    data.latestReadingDateTime = lastSeen;
  }
  return data;
}

export class CommunicationStatusMapper {
  static map(response: CommunicationStatusResponse): MappedCommunicationStatus {
    const data = normalizeCommunicationStatusData(response.data);
    return {
      success: response.success,
      data,
      date: data?.date ?? null,
      intervals: data?.intervals ?? null,
      delayed: data?.delayed ?? null,
      latestReadingDateTime: data?.latestReadingDateTime ?? null,
    };
  }
}
