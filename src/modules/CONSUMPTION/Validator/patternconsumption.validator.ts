import { expect } from "@playwright/test";
export class PatternConsumptionValidator {
    validateTable(data: any): void {
        expect(data.title).toBeTruthy();
        expect(Array.isArray(data.columns)).toBeTruthy();
        expect(Array.isArray(data.rows)).toBeTruthy();
    }
    validateRows(rows: any[]): void {
        expect(rows.length).toBeGreaterThan(0);
    }
    validateSlNo(rows: any[]): void {
        rows.forEach((row, index) => {
            expect(row.slNo).toBe(index + 1);
        });
    }
    validateRequiredFields(rows: any[]): void {
        rows.forEach(row => {
            expect(row).toHaveProperty("ivrsNumber");
            expect(row).toHaveProperty("phase");
            expect(row).toHaveProperty("sanctionLoadKw");

        });
    }
    validatePhase(rows: any[],allowedPhases: string[]): void {
        rows.forEach(row => {
            if (row.phase) {
                expect(allowedPhases).toContain(row.phase);
            }

        });
    }
    validateSanctionLoad(rows: any[]): void {
        rows.forEach(row => {
            expect(row.sanctionLoadKw)
                .toBeGreaterThanOrEqual(0);

        });
    }
    validateNoNaN(rows: any[]): void {
        rows.forEach(row => {
            Object.values(row).forEach(value => {
                if (typeof value === "number") {
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            });
        });
    }
    // ===================================
    // COMPARISON VALIDATIONS
    // ===================================
    validateComparison(rows: any[]): void {
        rows.forEach(row => {
            [
                "currentMonthKwh",
                "lastMonthKwh",
                "lastYearSameMonthKwh"
            ].forEach(field => {
                if (row[field] !== null) {
                    expect(typeof row[field]).toBe("number");
                    expect(row[field]).toBeGreaterThanOrEqual(0);
                }
            });
        });
    }
    // ===================================
    // LAST 3 MONTHS
    // ===================================
    validateLastThreeMonths(rows: any[]): void {
        rows.forEach(row => {
            if (!row.monthWise) return;
            ["DEC", "NOV", "OCT"]
                .forEach(month => {
                    expect(row.monthWise).toHaveProperty(month);
                    const data = row.monthWise[month];
                    if (data.kwh !== null) {
    expect(data.kwh).toBeGreaterThanOrEqual(0);
                            
                    }

                    if (data.kvah !== null) {
                        expect(data.kvah).toBeGreaterThanOrEqual(0);
                            
                    }

                    if (data.mdKw !== null) {
                        expect(data.mdKw).toBeGreaterThanOrEqual(0);
                    }
                });
        });
    }

    // ===================================
    // YEARLY
    // ===================================

    validateYearly(rows: any[]): void {
        rows.forEach(row => {
            const monthlyFields = [
                "janKwh", "febKwh", "marKwh",
                "aprKwh", "mayKwh", "junKwh",
                "julKwh", "augKwh", "sepKwh",
                "octKwh", "novKwh", "decKwh"
            ];
            monthlyFields.forEach(field => {
                if (row[field] !== null) {
                    expect(row[field]).toBeGreaterThanOrEqual(0);
                }
            });
            if (row.totalKwh !== null) {
                expect(row.totalKwh).toBeGreaterThanOrEqual(0);
            }
        });
    }
    validateYearlyTotal(rows: any[]): void {
        rows.forEach(row => {
            const months = [
                row.janKwh,
                row.febKwh,
                row.marKwh,
                row.aprKwh,
                row.mayKwh,
                row.junKwh,
                row.julKwh,
                row.augKwh,
                row.sepKwh,
                row.octKwh,
                row.novKwh,
                row.decKwh
            ];
            const sum = months.filter(x => x !== null).reduce((a, b) => a + b, 0);
            if (row.totalKwh !== null &&sum > 0) {
                expect(Math.abs(sum - row.totalKwh)).toBeLessThan(2);
            }
        });
    }
}