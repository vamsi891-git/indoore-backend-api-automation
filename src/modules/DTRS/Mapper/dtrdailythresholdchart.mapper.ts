import {
    derivePowerFactorFromEnergy,
    deriveReactiveEnergyKvarh,
} from "../utils/dtr-backend.util";

export type DtrDailyThresholdPeriod =
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

export type DtrDailyThresholdChartScenario =
    | "ddt_by_code_primary_hourly"
    | "ddt_by_code_primary_daily"
    | "ddt_by_code_primary_weekly"
    | "ddt_by_code_primary_monthly"
    | "ddt_by_code_primary_yearly"
    | "ddt_by_code_alt"
    | "ddt_ignore_unknown_query"
    | "contract_null_hourly"
    | "contract_null_daily"
    | "contract_null_weekly"
    | "contract_null_monthly"
    | "contract_null_yearly"
    | "contract_populated_energy"
    | "contract_reactive_derivation"
    | "contract_pf_from_energy"
    | "dtr_not_found"
    | "empty_dtr_code"
    | "invalid_period";

export interface ThresholdChartPoint {
    label: string;
    activeEnergyKwh: number | null;
    reactiveEnergyKvarh: number | null;
    apparentEnergyKvah: number | null;
    powerFactor: number | null;
}

export interface DtrDailyThresholdChartDataModel {
    period: DtrDailyThresholdPeriod;
    points: ThresholdChartPoint[];
}

export interface DtrDailyThresholdChartResponse {
    success: boolean;
    data?: DtrDailyThresholdChartDataModel | null;
}

export interface DtrDailyThresholdChartErrorResponse {
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

export interface MappedDtrDailyThresholdChart {
    success: boolean;
    period: DtrDailyThresholdPeriod;
    points: ThresholdChartPoint[];
}

const EMPTY_CHART: DtrDailyThresholdChartDataModel = {
    period: "hourly",
    points: [],
};

function toNumber(v: unknown): number | null {
    if (v == null) return null;
    const n = parseFloat(String(v));
    return Number.isNaN(n) ? null : n;
}

function mapPoint(raw: ThresholdChartPoint): ThresholdChartPoint {
    const activeEnergyKwh = toNumber(raw.activeEnergyKwh);
    const apparentEnergyKvah = toNumber(raw.apparentEnergyKvah);
    const powerFactor = toNumber(raw.powerFactor);
    const reactiveFromApi = toNumber(raw.reactiveEnergyKvarh);
    const reactiveEnergyKvarh =
        reactiveFromApi ??
        deriveReactiveEnergyKvarh(activeEnergyKwh, apparentEnergyKvah);
    const resolvedPowerFactor =
        powerFactor ??
        derivePowerFactorFromEnergy(activeEnergyKwh, apparentEnergyKvah);

    return {
        label: raw.label,
        activeEnergyKwh,
        reactiveEnergyKvarh,
        apparentEnergyKvah,
        powerFactor: resolvedPowerFactor,
    };
}

export class DtrDailyThresholdChartMapper {
    static map(response: DtrDailyThresholdChartResponse): MappedDtrDailyThresholdChart {
        const data = response.data ?? EMPTY_CHART;
        return {
            success: response.success,
            period: data.period,
            points: (data.points ?? []).map((point) => mapPoint(point)),
        };
    }
}
