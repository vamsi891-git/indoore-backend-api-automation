import { expect } from "@playwright/test";
export class DtrDailyThresholdChartValidator {
    // =====================================
    // SUCCESS VALIDATION
    // =====================================
    validateSuccess(response: any): void {
        expect(response.success).toBeTruthy();
    }
    // =====================================
    // ROOT FIELD VALIDATION
    // =====================================
    validateFields(data: any): void {
        expect(data).toHaveProperty("year");
        expect(data).toHaveProperty("points");
        expect(typeof data.year).toBe("number");
        expect(Array.isArray(data.points)).toBeTruthy();
    }
    // =====================================
    // YEAR VALIDATION
    // =====================================
    validateYear(year: number): void {
        expect(year).toBeGreaterThan(2020);
        expect(year).toBeLessThan(2100);
    }
    // =====================================
    // POINTS LENGTH
    // =====================================
    validatePointsLength(points: any[]): void {
        expect(points.length).toBe(12);
    }
    // =====================================
    // MONTH VALIDATION
    // =====================================
    validateMonthStructure(points: any[],expectedMonths: string[]): void {
        points.forEach((point,index) => {
            expect(point.month).toBe(index + 1);
            expect(point.monthLabel).toBe(expectedMonths[index]);
        });
    }
    // =====================================
    // POINT STRUCTURE
    // =====================================
    validatePointStructure(points: any[]): void {
        points.forEach(point => {
            expect(point).toHaveProperty("month");
            expect(point).toHaveProperty("monthLabel");
            expect(point).toHaveProperty("activePower");
            expect(point).toHaveProperty("reactivePower");
            expect(point).toHaveProperty("apparentPower");
            expect(point).toHaveProperty("powerFactor");
        });
    }
    // =====================================
    // MONTH RANGE VALIDATION
    // =====================================
    validateMonthRange(points: any[]): void {
        points.forEach(point => {
            expect(point.month).toBeGreaterThanOrEqual(1);
            expect(point.month).toBeLessThanOrEqual(12);
        });
    }
    // =====================================
    // NUMERIC / NULL VALIDATION
    // =====================================
    validateNumericOrNull(points: any[]): void {
        points.forEach(point => {
            const fields = [
                "activePower",
                "reactivePower",
                "apparentPower",
                "powerFactor"
            ];
            fields.forEach(field => {
                expect(point[field] === null || typeof point[field] === "number").toBeTruthy();
            });
        });
    }
    // =====================================
    // POWER FACTOR RANGE
    // =====================================
    validatePowerFactorRange(points: any[]): void {
        points.forEach(point => {
            if (point.powerFactor !== null) {
                expect(point.powerFactor).toBeGreaterThanOrEqual(-1);
                expect(point.powerFactor).toBeLessThanOrEqual(1);
            }
        });
    }
    // =====================================
    // NON NEGATIVE POWERS
    // =====================================
    validateNonNegativeValues(points: any[]): void {
        points.forEach(point => {
            const fields = ["activePower","reactivePower","apparentPower"];
            fields.forEach(field => {
                if (point[field] !== null) {
                    expect( point[field]).toBeGreaterThanOrEqual(0);
                }
            });
        });
    }
    // =====================================
    // MONTH LABEL VALIDATION
    // =====================================
    validateMonthLabelsNotEmpty(points: any[]): void {
        points.forEach(point => {
            expect(point.monthLabel.trim().length).toBeGreaterThan(0);
        });
    }
    // ====================================
    // UNIQUE MONTHS
    // =====================================
    validateUniqueMonths(points: any[]): void {
        const months =points.map(x => x.month);
        const unique =new Set(months);
        expect(unique.size).toBe(12);
    }
    // =====================================
    // CHRONOLOGICAL ORDER
    // =====================================
    validateMonthOrder(points: any[]): void {
        for (let i = 1;i < points.length;i++) {
            expect(points[i].month).toBeGreaterThan(points[i - 1].month);
        }
    }
    // =====================================
    // RESPONSE TYPE
    // =====================================
    validatePointTypes(points: any[]): void {
        points.forEach(point => {
            expect(typeof point.month).toBe("number");
            expect(typeof point.monthLabel).toBe("string");
        });
    }
}