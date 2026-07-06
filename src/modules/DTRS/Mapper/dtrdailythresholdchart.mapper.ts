import {
    deriveReactivePower,
    istCalendarMonth,
    istCalendarYear,
} from "../utils/dtr-backend.util";

export interface ThresholdPoint {
    month: number;
    monthLabel: string;
    activePower: number | null;
    reactivePower: number | null;
    apparentPower: number | null;
    powerFactor: number | null;
}

export interface DtrDailyThresholdChartDataModel {
    year: number;
    points: ThresholdPoint[];
}

export interface DtrDailyThresholdChartResponse {
    success: boolean;
    data?: DtrDailyThresholdChartDataModel;
}

const MONTH_LABELS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

function toNumber(v: unknown): number | null {
    if (v == null) return null;
    const n = parseFloat(String(v));
    return Number.isNaN(n) ? null : n;
}

function parseMonthFromLabel(label: string): number | null {
    const lower = label.toLowerCase();
    const shortNames = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "sept",
        "oct",
        "nov",
        "dec",
    ];

    for (let i = 0; i < MONTH_LABELS.length; i++) {
        const full = MONTH_LABELS[i]!.toLowerCase();
        const abbr = shortNames[i]!;
        if (lower.includes(full) || lower.includes(abbr)) {
            return i + 1;
        }
    }
    return null;
}

function resolveMonth(
    raw: Record<string, unknown>,
    index: number,
    totalPoints: number,
): number {
    if (totalPoints === 12) {
        return index + 1;
    }

    if (typeof raw.month === "number" && raw.month >= 1 && raw.month <= 12) {
        return raw.month;
    }

    const label = String(raw.label ?? raw.monthLabel ?? "").trim();
    if (label) {
        const fromLabel = parseMonthFromLabel(label);
        if (fromLabel != null) return fromLabel;
    }

    return index === 0 ? istCalendarMonth() : index + 1;
}

/** Maps legacy energy-shaped points to backend power contract when needed. */
function normalizePoint(
    raw: Record<string, unknown>,
    index: number,
    totalPoints: number,
): ThresholdPoint {
    const month = resolveMonth(raw, index, totalPoints);

    const activePower = toNumber(
        raw.activePower ?? raw.activeEnergyKwh ?? raw.activeEnergyKWh,
    );
    const apparentPower = toNumber(
        raw.apparentPower ?? raw.apparentEnergyKvah ?? raw.apparentEnergyKVAh,
    );
    const powerFactor = toNumber(raw.powerFactor);
    const reactivePower =
        toNumber(raw.reactivePower ?? raw.reactiveEnergyKvarh) ??
        deriveReactivePower(activePower, apparentPower, powerFactor);

    return {
        month,
        monthLabel: MONTH_LABELS[month - 1]!,
        activePower,
        reactivePower,
        apparentPower,
        powerFactor,
    };
}

export class DtrDailyThresholdChartMapper {
    static map(
        response: DtrDailyThresholdChartResponse,
        fallbackYear = istCalendarYear(),
    ) {
        const data = response.data;
        const year =
            typeof data?.year === "number" && Number.isFinite(data.year)
                ? data.year
                : fallbackYear;

        const rawPoints: unknown[] = Array.isArray(data?.points) ? data.points : [];
        const byMonth = new Map<number, ThresholdPoint>();

        for (const [index, point] of rawPoints.entries()) {
            const normalized = normalizePoint(
                point as Record<string, unknown>,
                index,
                rawPoints.length,
            );
            if (normalized.month >= 1 && normalized.month <= 12) {
                byMonth.set(normalized.month, normalized);
            }
        }

        const points = MONTH_LABELS.map((monthLabel, index) => {
            const month = index + 1;
            return (
                byMonth.get(month) ?? {
                    month,
                    monthLabel,
                    activePower: null,
                    reactivePower: null,
                    apparentPower: null,
                    powerFactor: null,
                }
            );
        });

        return { year, points };
    }
}
