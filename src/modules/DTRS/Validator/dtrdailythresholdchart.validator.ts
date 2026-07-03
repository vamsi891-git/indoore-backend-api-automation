import { expect } from "@playwright/test";
import { dtrDailyThresholdChartData } from "../Data/dtrdailythresholdchart.data";

type ThresholdPoint = {
    month: number;
    monthLabel: string;
    activePower: number | null;
    reactivePower: number | null;
    apparentPower: number | null;
    powerFactor: number | null;
};

type ChartData = {
    year: number;
    points: ThresholdPoint[];
};

export class DtrDailyThresholdChartValidator {
    // =====================================
    // RESPONSE ENVELOPE
    // =====================================
    validateResponseEnvelope(response: { success: boolean; data: unknown }): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    // =====================================
    // ROOT FIELDS — year + points
    // =====================================
    validateFields(data: ChartData): void {
        expect(data).toHaveProperty("year");
        expect(data).toHaveProperty("points");
        expect(typeof data.year).toBe("number");
        expect(Array.isArray(data.points)).toBeTruthy();
    }

    // =====================================
    // YEAR — calendar year for chart query
    // =====================================
    validateYear(year: number): void {
        expect(Number.isInteger(year)).toBeTruthy();
        expect(year).toBeGreaterThan(2020);
        expect(year).toBeLessThan(2100);
    }

    // =====================================
    // POINTS LENGTH — MONTH_INDEXES (12 months)
    // =====================================
    validatePointsLength(points: ThresholdPoint[]): void {
        expect(points.length).toBe(dtrDailyThresholdChartData.pointsCount);
    }

    // =====================================
    // MONTH + LABEL — MONTH_LABELS[month - 1]
    // =====================================
    validateMonthStructure(
        points: ThresholdPoint[],
        expectedMonths: readonly string[],
    ): void {
        points.forEach((point, index) => {
            expect(point.month).toBe(index + 1);
            expect(point.monthLabel).toBe(expectedMonths[index]);
        });
    }

    // =====================================
    // POINT STRUCTURE — exactly 6 fields
    // =====================================
    validatePointStructure(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            expect(Object.keys(point).sort()).toEqual(
                [...dtrDailyThresholdChartData.pointFields].sort(),
            );
        });
    }

    // =====================================
    // MONTH RANGE — 1..12
    // =====================================
    validateMonthRange(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            expect(point.month).toBeGreaterThanOrEqual(1);
            expect(point.month).toBeLessThanOrEqual(12);
        });
    }

    // =====================================
    // NUMERIC / NULL — toNumber() mapping
    // =====================================
    validateNumericOrNull(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            for (const field of dtrDailyThresholdChartData.powerFields) {
                const value = point[field];
                expect(value === null || typeof value === "number").toBeTruthy();
            }
        });
    }

    // =====================================
    // FINITE NUMBERS — no NaN
    // =====================================
    validateFiniteNumbers(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            for (const field of dtrDailyThresholdChartData.powerFields) {
                const value = point[field];
                if (typeof value === "number") {
                    expect(Number.isFinite(value)).toBeTruthy();
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            }
        });
    }

    // =====================================
    // POWER FACTOR RANGE
    // =====================================
    validatePowerFactorRange(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            if (point.powerFactor !== null) {
                expect(point.powerFactor).toBeGreaterThanOrEqual(-1);
                expect(point.powerFactor).toBeLessThanOrEqual(1);
            }
        });
    }

    // =====================================
    // NON-NEGATIVE POWERS
    // =====================================
    validateNonNegativeValues(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            const fields = ["activePower", "reactivePower", "apparentPower"] as const;
            for (const field of fields) {
                const value = point[field];
                if (value !== null) {
                    expect(value).toBeGreaterThanOrEqual(0);
                }
            }
        });
    }

    // =====================================
    // EMPTY POINTS — no archive data → all null (emptyPoints())
    // =====================================
    validateEmptyPointsState(points: ThresholdPoint[]): void {
        const allNull = points.every(
            (p) =>
                p.activePower === null &&
                p.reactivePower === null &&
                p.apparentPower === null &&
                p.powerFactor === null,
        );
        if (allNull) {
            expect(points.length).toBe(12);
        }
    }

    // =====================================
    // MONTH LABELS — non-empty strings
    // =====================================
    validateMonthLabelsNotEmpty(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            expect(point.monthLabel.trim().length).toBeGreaterThan(0);
        });
    }

    // =====================================
    // UNIQUE MONTHS
    // =====================================
    validateUniqueMonths(points: ThresholdPoint[]): void {
        const months = points.map((x) => x.month);
        expect(new Set(months).size).toBe(dtrDailyThresholdChartData.pointsCount);
    }

    // =====================================
    // CHRONOLOGICAL ORDER — MONTH_INDEXES 1..12
    // =====================================
    validateMonthOrder(points: ThresholdPoint[]): void {
        for (let i = 1; i < points.length; i++) {
            expect(points[i].month).toBe(points[i - 1].month + 1);
        }
    }

    // =====================================
    // POINT TYPES
    // =====================================
    validatePointTypes(points: ThresholdPoint[]): void {
        points.forEach((point) => {
            expect(typeof point.month).toBe("number");
            expect(typeof point.monthLabel).toBe("string");
        });
    }
}
