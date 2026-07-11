export type DtrPowerStatusScenario =
    | "dev_period_hourly"
    | "dev_period_daily"
    | "dev_period_weekly"
    | "dev_period_monthly"
    | "dev_period_yearly"
    | "dev_ignore_unknown_query"
    | "contract_null_hourly"
    | "contract_null_daily"
    | "contract_null_weekly"
    | "contract_live_monthly"
    | "contract_live_yearly"
    | "contract_on_off_mixed"
    | "invalid_period";

export type DtrPowerStatusPeriod =
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

export interface PowerPoint {
    label: string;
    dtrsOn: number;
    dtrsOff: number;
    onPercentage: number;
    offPercentage: number;
}

export interface DtrPowerStatusDataModel {
    period: DtrPowerStatusPeriod;
    points: PowerPoint[];
}

export interface DtrPowerStatusResponse {
    success: boolean;
    data?: DtrPowerStatusDataModel | null;
    message?: string;
}

export interface DtrPowerStatusErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrPowerStatus extends DtrPowerStatusDataModel {
    success: boolean;
}

/** Bucket counts from power-status trend SQL windows. */
export const dtrPowerStatusPeriodPointCounts: Record<
    DtrPowerStatusPeriod,
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

export const dtrPowerStatusLabelPatterns: Record<
    DtrPowerStatusPeriod,
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

export class DtrPowerStatusMapper {
    static map(response: DtrPowerStatusResponse): MappedDtrPowerStatus {
        const data = response.data ?? { period: "daily", points: [] };
        return {
            success: response.success,
            period: data.period ?? "daily",
            points: (data.points ?? []).map((point) => ({
                label: point.label,
                dtrsOn: toNumber(point.dtrsOn),
                dtrsOff: toNumber(point.dtrsOff),
                onPercentage: toNumber(point.onPercentage),
                offPercentage: toNumber(point.offPercentage),
            })),
        };
    }
}
