import { expect } from "@playwright/test";
import {
    FeederConsumptionGranularity,
    FeederConsumptionPoint,
    FeederDailyConsumptionData,
} from "../Mapper/feeder-daily-consumption.mapper";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_LABEL =
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d{2}-\d{2}$/;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const POINT_REQUIRED_FIELDS = ["label", "key", "kwh"] as const;

function parseDayKey(key: string): { y: number; m: number; d: number } | null {
    const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
        return null;
    }
    return { y, m, d };
}

function utcNoonWeekday(y: number, m: number, d: number): string {
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return WEEKDAYS[date.getUTCDay()]!;
}

function expectedDayLabel(y: number, m: number, d: number): string {
    const wd = utcNoonWeekday(y, m, d);
    return `${wd} ${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}`;
}

function dayKeyToMs(key: string): number | null {
    const parts = parseDayKey(key);
    if (!parts) {
        return null;
    }
    return Date.UTC(parts.y, parts.m - 1, parts.d);
}

export class FeederDailyConsumptionValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: FeederDailyConsumptionData) {
        expect(data).toHaveProperty("granularity");
        expect(data).toHaveProperty("unit");
        expect(data).toHaveProperty("points");
        expect(Array.isArray(data.points)).toBeTruthy();
    }

    validateGranularityEcho(
        data: FeederDailyConsumptionData,
        expected: FeederConsumptionGranularity,
    ) {
        expect(data.granularity).toBe(expected);
    }

    validateUnit(data: FeederDailyConsumptionData, expectedUnit: string) {
        expect(data.unit).toBe(expectedUnit);
    }

    validateEmptyScenario(data: FeederDailyConsumptionData) {
        if (data.points.length !== 0) {
            return;
        }
        expect(data.points).toEqual([]);
    }

    validateDayPointCount(
        points: FeederConsumptionPoint[],
        expectedCount: number,
    ) {
        if (points.length === 0) {
            return;
        }
        expect(points.length).toBe(expectedCount);
    }

    validatePointRequiredFields(points: FeederConsumptionPoint[]) {
        points.forEach((point) => {
            POINT_REQUIRED_FIELDS.forEach((field) => {
                expect(point).toHaveProperty(field);
            });
        });
    }

    validatePointStructure(points: FeederConsumptionPoint[]) {
        points.forEach((point) => {
            expect(typeof point.label).toBe("string");
            expect(point.label.trim().length).toBeGreaterThan(0);
            expect(typeof point.key).toBe("string");
            expect(point.key.trim().length).toBeGreaterThan(0);
            expect(
                point.kwh === null || typeof point.kwh === "number",
            ).toBeTruthy();
        });
    }

    validateDayLabelFormat(points: FeederConsumptionPoint[]) {
        points.forEach((point) => {
            expect(DAY_LABEL.test(point.label.trim())).toBeTruthy();
        });
    }

    validateDayKeyFormat(points: FeederConsumptionPoint[]) {
        points.forEach((point) => {
            expect(DAY_KEY.test(point.key.trim())).toBeTruthy();
        });
    }

    validateLabelKeyAlignment(points: FeederConsumptionPoint[]) {
        points.forEach((point) => {
            const parts = parseDayKey(point.key);
            expect(parts).not.toBeNull();
            if (!parts) {
                return;
            }
            expect(point.label).toBe(
                expectedDayLabel(parts.y, parts.m, parts.d),
            );
        });
    }

    validateKwhValues(points: FeederConsumptionPoint[]) {
        points.forEach((point) => {
            if (point.kwh === null) {
                return;
            }
            expect(Number.isFinite(point.kwh)).toBeTruthy();
            expect(point.kwh).toBeGreaterThanOrEqual(0);
        });
    }

    validateUniqueKeys(points: FeederConsumptionPoint[]) {
        const keys = points.map((point) => point.key);
        expect(new Set(keys).size).toBe(keys.length);
    }

    validateChronologicalOrder(points: FeederConsumptionPoint[]) {
        if (points.length < 2) {
            return;
        }
        for (let i = 1; i < points.length; i++) {
            const prev = dayKeyToMs(points[i - 1]!.key);
            const curr = dayKeyToMs(points[i]!.key);
            if (prev != null && curr != null) {
                expect(curr).toBeGreaterThan(prev);
            }
        }
    }

    validateConsecutiveDays(points: FeederConsumptionPoint[]) {
        if (points.length < 2) {
            return;
        }
        const oneDayMs = 24 * 60 * 60 * 1000;
        for (let i = 1; i < points.length; i++) {
            const prev = dayKeyToMs(points[i - 1]!.key);
            const curr = dayKeyToMs(points[i]!.key);
            if (prev != null && curr != null) {
                expect(curr - prev).toBe(oneDayMs);
            }
        }
    }

    validateBusinessRules(data: FeederDailyConsumptionData) {
        expect(data.granularity).toBeTruthy();
        expect(data.unit).toBeTruthy();
        expect(Array.isArray(data.points)).toBeTruthy();
    }
}
