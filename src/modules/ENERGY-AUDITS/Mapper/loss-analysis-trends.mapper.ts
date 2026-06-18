export const LOSS_ANALYSIS_TRENDS_HOUR_COUNT = 24;

export const LOSS_ANALYSIS_TRENDS_HOUR_KEYS = Array.from(
  { length: LOSS_ANALYSIS_TRENDS_HOUR_COUNT },
  (_, index) => `H${index + 1}`,
);

export interface LossAnalysisTrendsItem {
  hour: string;
  time: string;
  lossPct: number;
}

export interface LossAnalysisTrendsData {
  networkLookupId: number;
  date: string;
  items: LossAnalysisTrendsItem[];
}

export interface LossAnalysisTrendsResponse {
  success: boolean;
  data: LossAnalysisTrendsData;
}

export interface LossAnalysisTrendsQuery {
  networkLookupId: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function mapTrendItem(raw: Record<string, unknown>): LossAnalysisTrendsItem {
  return {
    hour: String(raw.hour ?? "").trim(),
    time: String(raw.time ?? "").trim(),
    lossPct: toNumber(raw.lossPct),
  };
}

export function mapLossAnalysisTrendsData(
  response: LossAnalysisTrendsResponse,
): LossAnalysisTrendsData {
  const data = response.data;
  const rawItems = (data.items ?? []) as unknown as Record<string, unknown>[];
  return {
    networkLookupId: Number(data.networkLookupId),
    date: String(data.date ?? "").trim(),
    items: rawItems.map(mapTrendItem),
  };
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) {
    return false;
  }
  const date = parseIsoDate(value);
  return !Number.isNaN(date.getTime());
}

export function hourKeyToIndex(hour: string): number | null {
  const match = /^H([1-9]|1\d|2[0-4])$/.exec(hour.trim());
  if (!match) {
    return null;
  }
  return Number(match[1]) - 1;
}

export function expectedHourTime(hourIndex: number): string {
  return `${String(hourIndex).padStart(2, "0")}:00`;
}
