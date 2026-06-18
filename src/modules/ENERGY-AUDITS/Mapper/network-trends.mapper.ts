export type NetworkTrendReportType = "billing" | "dp" | "ls";

export const NETWORK_TREND_DAILY_PERIOD_COUNT = 12;
export const NETWORK_TREND_HOURLY_PERIOD_COUNT = 24;

export const NETWORK_TREND_HOUR_KEYS = Array.from(
  { length: NETWORK_TREND_HOURLY_PERIOD_COUNT },
  (_, index) => `H${index + 1}`,
);

export interface NetworkTrendMonthlyItem {
  date: null;
  month: number;
  year: number;
  periodLabel: string;
  lossPct: number;
}

export interface NetworkTrendDailyItem {
  date: string;
  month: null;
  year: null;
  periodLabel: string;
  lossPct: number;
}

export interface NetworkTrendHourlyItem {
  hour: string;
  time: string;
  lossPct: number;
}

export type NetworkTrendItem =
  | NetworkTrendMonthlyItem
  | NetworkTrendDailyItem
  | NetworkTrendHourlyItem;

export interface NetworkTrendBillingData {
  reportType: "billing";
  anchorDate: null;
  anchorMonth: number;
  anchorYear: number;
  items: NetworkTrendMonthlyItem[];
}

export interface NetworkTrendDpData {
  reportType: "dp";
  anchorDate: string;
  anchorMonth: null;
  anchorYear: null;
  items: NetworkTrendDailyItem[];
}

export interface NetworkTrendLsData {
  reportType: "ls";
  anchorDate: string;
  anchorMonth: null;
  anchorYear: null;
  items: NetworkTrendHourlyItem[];
}

export type NetworkTrendData =
  | NetworkTrendBillingData
  | NetworkTrendDpData
  | NetworkTrendLsData;

export interface NetworkTrendResponse {
  success: boolean;
  data: NetworkTrendData;
}

export interface NetworkTrendQuery {
  "report-type": NetworkTrendReportType;
  networkLookupId: number;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function mapMonthlyItem(raw: Record<string, unknown>): NetworkTrendMonthlyItem {
  return {
    date: null,
    month: toNullableNumber(raw.month)!,
    year: toNullableNumber(raw.year)!,
    periodLabel: String(raw.periodLabel ?? "").trim(),
    lossPct: Number(raw.lossPct ?? 0),
  };
}

function mapDailyItem(raw: Record<string, unknown>): NetworkTrendDailyItem {
  return {
    date: toNullableString(raw.date)!,
    month: null,
    year: null,
    periodLabel: String(raw.periodLabel ?? "").trim(),
    lossPct: Number(raw.lossPct ?? 0),
  };
}

function mapHourlyItem(raw: Record<string, unknown>): NetworkTrendHourlyItem {
  return {
    hour: String(raw.hour ?? "").trim(),
    time: String(raw.time ?? "").trim(),
    lossPct: Number(raw.lossPct ?? 0),
  };
}

export function mapNetworkTrendData(
  response: NetworkTrendResponse,
): NetworkTrendData {
  const data = response.data as unknown as Record<string, unknown>;
  const reportType = String(data.reportType ?? "") as NetworkTrendReportType;
  const rawItems = (data.items as Record<string, unknown>[]) ?? [];

  if (reportType === "billing") {
    return {
      reportType: "billing",
      anchorDate: null,
      anchorMonth: toNullableNumber(data.anchorMonth)!,
      anchorYear: toNullableNumber(data.anchorYear)!,
      items: rawItems.map(mapMonthlyItem),
    };
  }

  if (reportType === "dp") {
    return {
      reportType: "dp",
      anchorDate: toNullableString(data.anchorDate)!,
      anchorMonth: null,
      anchorYear: null,
      items: rawItems.map(mapDailyItem),
    };
  }

  return {
    reportType: "ls",
    anchorDate: toNullableString(data.anchorDate)!,
    anchorMonth: null,
    anchorYear: null,
    items: rawItems.map(mapHourlyItem),
  };
}

export function monthYearKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function addMonths(
  month: number,
  year: number,
  delta: number,
): { month: number; year: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDpPeriodLabel(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export function isMonthlyTrendData(
  data: NetworkTrendData,
): data is NetworkTrendBillingData {
  return data.reportType === "billing";
}

export function isDailyTrendData(
  data: NetworkTrendData,
): data is NetworkTrendDpData {
  return data.reportType === "dp";
}

export function isHourlyTrendData(
  data: NetworkTrendData,
): data is NetworkTrendLsData {
  return data.reportType === "ls";
}
