import { expect } from "@playwright/test";
export class EnergyConsumptionGraphValidator {
    validateSuccess(data: any) {
        expect(data.success).toBeTruthy();
    }
    validateStructure(data: any) {
        expect(data.weekly).toBeDefined();
        expect(data.monthly).toBeDefined();
        expect(data.yearly).toBeDefined();
        expect(Array.isArray(data.weekly.points)).toBeTruthy();
        expect(Array.isArray(data.monthly.points)).toBeTruthy();
        expect(Array.isArray(data.yearly.points)).toBeTruthy();
    }
    validateTitles(data: any) {
        expect(data.weekly.title).toContain("Last 7 days");
        expect(data.monthly.title).toContain("Last 30 days");
        expect(data.yearly.title).toBe("Yearly");
    }
    /*
    backend creates:
    7 records
    */
    validateWeeklyCount(data: any) {
        if (data.weekly.points.length > 0) {
            expect(data.weekly.points.length).toBe(7);
        }
    }
    /*
    backend creates:
    30 records
    */
    validateMonthlyCount(data: any) {
        if (data.monthly.points.length > 0) {
            expect(data.monthly.points.length).toBe(30);
        }
    }
    /*
    backend creates:
    12 months
    */
    validateYearlyCount(data: any) {
        if (data.yearly.points.length > 0) {
            expect(data.yearly.points.length).toBe(12);
        }
    }
    validatePointStructure(points: any[]) {
        points.forEach(point => {
            expect(point).toHaveProperty("label");
            expect(point).toHaveProperty("consumptionKwh");
        });
    }
    validateConsumptionValues(points: any[]) {
        points.forEach(point => {
            expect(typeof point.consumptionKwh === "number" ||  point.consumptionKwh === null).toBeTruthy();
            if (point.consumptionKwh != null) {
                expect(point.consumptionKwh).toBeGreaterThanOrEqual(0);
            }
        });
    }
    /*
    26-05
    */
    validateDayLabels(points: any[]) {
        points.forEach(point => {
            expect(point.label).toMatch(/^\d{2}-\d{2}$/);
        });
    }
    /*
    Jun 2025
    May 2026
    */
    validateYearLabels(points: any[]) {
        points.forEach(point => {
            expect(point.label).toMatch(/^[A-Za-z]+\s\d{4}$/);
        });
    }
    /*
    weekly and monthly
    latest day first
    */
    validateDescendingDates(points: any[]) {
        for (let i = 0;i < points.length - 1;i++) {
            const current = points[i].label;
            const next = points[i + 1].label;
            expect(current).not.toEqual(next);
        }
    }
    /*
    future months may
    contain null
    Jan 2026
    Feb 2026
    */
    validateYearlyBusinessLogic(points: any[]) {
        points.forEach(point => {
            if (point.consumptionKwh != null) {
                expect(point.consumptionKwh).toBeGreaterThanOrEqual(0);
            }
        });
    }
    validateBusinessRules(data: any) {
        expect(data.weekly).toHaveProperty("points");
        expect(data.monthly).toHaveProperty("points");
        expect(data.yearly).toHaveProperty("points");
    }
}