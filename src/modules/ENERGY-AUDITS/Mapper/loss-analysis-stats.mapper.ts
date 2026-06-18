export const LOSS_ANALYSIS_STATS_HOUR_COUNT = 24;

export const LOSS_ANALYSIS_STATS_HOUR_KEYS = Array.from(
  { length: LOSS_ANALYSIS_STATS_HOUR_COUNT },
  (_, index) => `H${index + 1}`,
);

export interface LossAnalysisStatsHourBucket {
  hour: string;
  time: string;
  lossPct: number;
}

export interface LossAnalysisStatsData {
  networkLookupId: number;
  fromDate: string;
  toDate: string;
  totalEnergyInput: number;
  totalConsumption: number;
  totalLoss: number;
  peakLossHour: LossAnalysisStatsHourBucket;
  lowestLossHour: LossAnalysisStatsHourBucket;
}

export interface LossAnalysisStatsResponse {
  success: boolean;
  data: LossAnalysisStatsData;
}

export interface LossAnalysisStatsQuery {
  networkLookupId: number;
  fromDate: string;
  toDate: string;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function mapHourBucket(raw: unknown): LossAnalysisStatsHourBucket {
  const bucket = (raw ?? {}) as Record<string, unknown>;
  return {
    hour: String(bucket.hour ?? "").trim(),
    time: String(bucket.time ?? "").trim(),
    lossPct: toNumber(bucket.lossPct),
  };
}

export function mapLossAnalysisStatsData(
  response: LossAnalysisStatsResponse,
): LossAnalysisStatsData {
  const data = response.data;
  return {
    networkLookupId: Number(data.networkLookupId),
    fromDate: String(data.fromDate ?? "").trim(),
    toDate: String(data.toDate ?? "").trim(),
    totalEnergyInput: toNumber(data.totalEnergyInput),
    totalConsumption: toNumber(data.totalConsumption),
    totalLoss: toNumber(data.totalLoss),
    peakLossHour: mapHourBucket(data.peakLossHour),
    lowestLossHour: mapHourBucket(data.lowestLossHour),
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

export function expectedTotalLoss(
  totalEnergyInput: number,
  totalConsumption: number,
): number {
  return Math.max(0, totalEnergyInput - totalConsumption);
}
