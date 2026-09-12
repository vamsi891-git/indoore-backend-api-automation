export type ReportsOverviewTrendDirection = "up" | "down" | "flat";

export interface ReportsOverviewKpi {
  currentValue: number;
  previousValue: number;
  percentageChange: number;
  trendDirection: ReportsOverviewTrendDirection | string;
  comparisonAvailable: boolean;
  available: boolean;
}

export interface ReportsOverviewPeriod {
  from: string;
  to: string;
}

export interface ReportsOverviewDataModel {
  successful: ReportsOverviewKpi;
  scheduled: ReportsOverviewKpi;
  downloads: ReportsOverviewKpi;
  failed: ReportsOverviewKpi;
  currentPeriod: ReportsOverviewPeriod;
  comparisonPeriod: ReportsOverviewPeriod;
}

export interface ReportsOverviewErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface ReportsOverviewResponse {
  success: boolean;
  data?: ReportsOverviewDataModel | null;
  message?: string;
  error?: ReportsOverviewErrorBody["error"];
}

export interface MappedReportsOverview {
  success: boolean;
  successful: ReportsOverviewKpi | null;
  scheduled: ReportsOverviewKpi | null;
  downloads: ReportsOverviewKpi | null;
  failed: ReportsOverviewKpi | null;
  currentPeriod: ReportsOverviewPeriod | null;
  comparisonPeriod: ReportsOverviewPeriod | null;
}

export type ReportsOverviewScenario =
  | "dev_live"
  | "dev_ignore_unknown_query"
  | "contract_live_zeros"
  | "contract_nonzero_trends";

export const reportsOverviewKpiKeys = [
  "successful",
  "scheduled",
  "downloads",
  "failed",
] as const;

export const reportsOverviewKpiFieldKeys = [
  "currentValue",
  "previousValue",
  "percentageChange",
  "trendDirection",
  "comparisonAvailable",
  "available",
] as const;

export const reportsOverviewDataKeys = [
  ...reportsOverviewKpiKeys,
  "currentPeriod",
  "comparisonPeriod",
] as const;

function asKpi(value: unknown): ReportsOverviewKpi | null {
  if (value === null || value === undefined || typeof value !== "object") {
    return null;
  }
  const k = value as Record<string, unknown>;
  return {
    currentValue: Number(k.currentValue ?? 0),
    previousValue: Number(k.previousValue ?? 0),
    percentageChange: Number(k.percentageChange ?? 0),
    trendDirection: String(k.trendDirection ?? "flat"),
    comparisonAvailable: Boolean(k.comparisonAvailable),
    available: Boolean(k.available),
  };
}

function asPeriod(value: unknown): ReportsOverviewPeriod | null {
  if (value === null || value === undefined || typeof value !== "object") {
    return null;
  }
  const p = value as Record<string, unknown>;
  return {
    from: String(p.from ?? ""),
    to: String(p.to ?? ""),
  };
}

export class ReportsOverviewMapper {
  static map(response: ReportsOverviewResponse): MappedReportsOverview {
    const data = response.data ?? ({} as ReportsOverviewDataModel);
    return {
      success: response.success,
      successful: asKpi(data.successful),
      scheduled: asKpi(data.scheduled),
      downloads: asKpi(data.downloads),
      failed: asKpi(data.failed),
      currentPeriod: asPeriod(data.currentPeriod),
      comparisonPeriod: asPeriod(data.comparisonPeriod),
    };
  }
}
