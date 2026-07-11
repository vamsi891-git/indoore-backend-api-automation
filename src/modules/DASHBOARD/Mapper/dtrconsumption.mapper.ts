export type DtrConsumptionScenario =
    | "dev_period_hourly"
    | "dev_period_daily"
    | "dev_period_weekly"
    | "dev_period_monthly"
    | "dev_period_yearly"
    | "dev_ignore_unknown_query"
    | "contract_null_hourly"
    | "contract_null_daily"
    | "contract_null_weekly"
    | "contract_null_monthly"
    | "contract_null_yearly"
    | "contract_populated_points"
    | "invalid_period";

export type DtrConsumptionPeriod =
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

export interface ConsumptionPoint {
    label: string;
    kwh: number;
    kvah: number;
    kvarh: number;
}

export interface DtrConsumptionDataModel {
    period: DtrConsumptionPeriod;
    points: ConsumptionPoint[];
}

export interface DtrConsumptionResponse {
    success: boolean;
    data?: DtrConsumptionDataModel | null;
    message?: string;
}

export interface DtrConsumptionErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrConsumption extends DtrConsumptionDataModel {
    success: boolean;
}

/** Bucket counts from consumption trend SQL windows. */
export const dtrConsumptionPeriodPointCounts: Record<
    DtrConsumptionPeriod,
    number
> = {
    hourly: 12,
    daily: 12,
    weekly: 8,
    monthly: 12,
    yearly: 12,
};

const DAILY_LABEL_PATTERN = /^\d{1,2}\s+\w{3}$/;
const HOURLY_LABEL_PATTERN = /^\d{2}:\d{2}$/;
const WEEKLY_LABEL_PATTERN = /^W\d+$/;
const MONTHLY_LABEL_PATTERN = /^\w+\s+\d{4}$/;
const YEARLY_LABEL_PATTERN = /^\d{4}$/;

export const dtrConsumptionLabelPatterns: Record<
    DtrConsumptionPeriod,
    RegExp
> = {
    hourly: HOURLY_LABEL_PATTERN,
    daily: DAILY_LABEL_PATTERN,
    weekly: WEEKLY_LABEL_PATTERN,
    monthly: MONTHLY_LABEL_PATTERN,
    yearly: YEARLY_LABEL_PATTERN,
};

function toNumber(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

export class DtrConsumptionMapper {
    static map(response: DtrConsumptionResponse): MappedDtrConsumption {
        const data = response.data ?? { period: "daily", points: [] };
        return {
            success: response.success,
            period: data.period ?? "daily",
            points: (data.points ?? []).map((point) => ({
                label: point.label,
                kwh: toNumber(point.kwh),
                kvah: toNumber(point.kvah),
                kvarh: toNumber(point.kvarh),
            })),
        };
    }
}
