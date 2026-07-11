export type DtrSummaryScenario =
    | "dev_period_hourly"
    | "dev_period_daily"
    | "dev_period_weekly"
    | "dev_period_monthly"
    | "dev_period_yearly"
    | "dev_ignore_unknown_query"
    | "contract_live_hourly"
    | "contract_live_daily"
    | "contract_live_weekly"
    | "contract_live_monthly"
    | "contract_live_yearly"
    | "contract_all_off_scenario"
    | "invalid_period";

export type DtrSummaryPeriod =
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

export interface SummaryMetric {
    label: string;
    count: number;
    trends: number[];
}

export interface DtrSummaryDataModel {
    period: DtrSummaryPeriod;
    totalDtrs: SummaryMetric;
    dtrsOn: SummaryMetric;
    dtrsOff: SummaryMetric;
    activeAlerts: SummaryMetric;
}

export interface DtrSummaryResponse {
    success: boolean;
    data?: DtrSummaryDataModel | null;
    message?: string;
}

export interface DtrSummaryErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrSummary extends DtrSummaryDataModel {
    success: boolean;
}

/** Trend bucket counts from `fetchDtrSummaryKpiBundle` / summary trend SQL windows. */
export const dtrSummaryPeriodTrendLengths: Record<DtrSummaryPeriod, number> = {
    hourly: 12,
    daily: 12,
    weekly: 8,
    monthly: 12,
    yearly: 12,
};

const EMPTY_SUMMARY: DtrSummaryDataModel = {
    period: "daily",
    totalDtrs: { label: "", count: 0, trends: [] },
    dtrsOn: { label: "", count: 0, trends: [] },
    dtrsOff: { label: "", count: 0, trends: [] },
    activeAlerts: { label: "", count: 0, trends: [] },
};

function mapMetric(raw: SummaryMetric | undefined, fallbackLabel: string): SummaryMetric {
    return {
        label: raw?.label ?? fallbackLabel,
        count: Number(raw?.count ?? 0),
        trends: (raw?.trends ?? []).map((value) => Number(value)),
    };
}

export class DtrSummaryMapper {
    static map(response: DtrSummaryResponse): MappedDtrSummary {
        const data = response.data ?? EMPTY_SUMMARY;
        return {
            success: response.success,
            period: data.period ?? "daily",
            totalDtrs: mapMetric(data.totalDtrs, "Total DTRs"),
            dtrsOn: mapMetric(data.dtrsOn, "DTRs ON"),
            dtrsOff: mapMetric(data.dtrsOff, "DTRs OFF"),
            activeAlerts: mapMetric(data.activeAlerts, "Active Alerts"),
        };
    }
}
