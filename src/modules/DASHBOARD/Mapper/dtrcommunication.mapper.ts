export type DtrCommunicationScenario =
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
    | "contract_populated_daily"
    | "invalid_period";

export type DtrCommunicationPeriod =
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

export interface DtrCommunicationPoint {
    label: string;
    communicating: number;
    nonCommunicating: number;
}

export interface DtrCommunicationDataModel {
    period: DtrCommunicationPeriod;
    points: DtrCommunicationPoint[];
}

export interface DtrCommunicationResponse {
    success: boolean;
    data?: DtrCommunicationDataModel | null;
    message?: string;
}

export interface DtrCommunicationErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrCommunication extends DtrCommunicationDataModel {
    success: boolean;
}

/** Bucket counts from `fetchDtrCommunicationTrendBuckets` calendar windows. */
export const dtrCommunicationPeriodPointCounts: Record<
    DtrCommunicationPeriod,
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

export const dtrCommunicationLabelPatterns: Record<
    DtrCommunicationPeriod,
    RegExp
> = {
    hourly: HOURLY_LABEL_PATTERN,
    daily: DAILY_LABEL_PATTERN,
    weekly: WEEKLY_LABEL_PATTERN,
    monthly: MONTHLY_LABEL_PATTERN,
    yearly: YEARLY_LABEL_PATTERN,
};

function toInt(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export class DtrCommunicationMapper {
    static map(response: DtrCommunicationResponse): MappedDtrCommunication {
        const data = response.data ?? { period: "daily", points: [] };
        return {
            success: response.success,
            period: data.period ?? "daily",
            points: (data.points ?? []).map((point) => ({
                label: point.label,
                communicating: toInt(point.communicating),
                nonCommunicating: toInt(point.nonCommunicating),
            })),
        };
    }
}
