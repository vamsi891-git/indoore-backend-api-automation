import { expect } from "@playwright/test";
export class EnergyFlowValidator {
    validateSuccess(data: any) {
        expect(data.success).toBeTruthy();
    }
    validateStructure(data: any) {
        expect(data.title).toBeDefined();
        expect(data.subtitle).toBeDefined();
        expect(data.source).toBeDefined();
        expect(Array.isArray(data.points)).toBeTruthy();
    }
    validateTitles(data: any) {
        expect(data.title).toBe("Energy Flow");
        expect(data.subtitle).toContain("last 7 days");
    }
    validateSource(data: any) {
        expect(["SP_DP", "TP_LS"].includes(data.source)).toBeTruthy();
    }
    /*
    backend:
    last 7 days
    */
    validatePointsCount(data: any) {
        if (data.points.length > 0) {
            expect(data.points.length).toBe(7);
        }
    }
    /*
    Wed Thu Fri
    */
    validateWeekdayLabels(points: any[]) {
        points.forEach(point => {
            expect(point.label).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
        });
    }

    /*
    2026-05-20
    */
    validateDateFormat(points: any[]) {
        points.forEach(point => {
            expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    }
    validatePointStructure(points: any[]) {
        points.forEach(point => {
            expect(point).toHaveProperty("label");
            expect(point).toHaveProperty("date");
            expect(point).toHaveProperty("kwhImport");
            expect(point).toHaveProperty("kvahImport");
            expect(point).toHaveProperty("kwhExport");
            expect(point).toHaveProperty("kvahExport");
        });
    }
    /*
    backend energy
    difference logic

    cannot be negative
    */
    validateEnergyValues(points: any[]) {
        points.forEach(point => {
            expect(point.kwhImport).toBeGreaterThanOrEqual(0);
            expect(point.kvahImport).toBeGreaterThanOrEqual(0);
            expect(point.kwhExport).toBeGreaterThanOrEqual(0);
            expect(point.kvahExport).toBeGreaterThanOrEqual(0);
        });
    }
    /*
    dates should increase
    day-by-day
    */
    validateDateSequence(points: any[]) {
        for ( let i = 0; i < points.length - 1; i++) {
            const current =
                new Date(points[i].date);
            const next =new Date(points[i + 1].date);
            expect(next.getTime()).toBeGreaterThan(current.getTime());
        }
    }
    /*
    duplicate dates impossible
    */
    validateUniqueDates(points: any[]) {
        const dates =
            points.map(x => x.date);
        expect(new Set(dates).size).toBe(dates.length);
    }
    /*
    weekday and date
    must match
    */
    validateDayDateMapping(points: any[]) {
        points.forEach(point => {
            const day =new Date(point.date).toLocaleString('en-US',{    weekday: 'short'});
            expect(day).toContain(point.label);
        });
    }
    validateBusinessLogic(data: any) {
        expect(data).toHaveProperty("source");
        expect(data).toHaveProperty("points");
    }
}