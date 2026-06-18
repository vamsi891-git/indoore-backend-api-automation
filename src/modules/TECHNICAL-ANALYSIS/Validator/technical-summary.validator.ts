import { expect } from "@playwright/test";
export class TechnicalSummaryValidator {
    validateMonth(month: number): void {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
    }
    validateYear(year: number): void {
        expect(year).toBeGreaterThan(2000);
    }
    validateReportsExist(reports: any[]): void {
        expect(Array.isArray(reports)).toBeTruthy();
        expect(reports.length).toBeGreaterThan(0);
    }
    validateFields(report: any): void {
        expect(report).toHaveProperty("analysisType");
        expect(report).toHaveProperty("reportName");
        expect(report).toHaveProperty("category");
        expect(report).toHaveProperty("totalCount");
        expect(report).toHaveProperty("domesticCount");
        expect(report).toHaveProperty("nonDomesticCount");
    }
    validateTypes(report: any): void {
        expect(typeof report.analysisType).toBe("string");
        expect(typeof report.reportName).toBe("string");
        expect(typeof report.category).toBe("string");
        expect(typeof report.totalCount).toBe("number");
        expect(typeof report.domesticCount).toBe("number");
        expect(typeof report.nonDomesticCount).toBe("number");
    }
    validateNaN(report: any): void {
        expect(Number.isNaN(report.totalCount)).toBeFalsy();
        expect(Number.isNaN(report.domesticCount)).toBeFalsy();
        expect(Number.isNaN(report.nonDomesticCount)).toBeFalsy();
    }
    validateCounts(report: any): void {
        expect(report.totalCount).toBeGreaterThanOrEqual(0);
        expect(report.domesticCount).toBeGreaterThanOrEqual(0);
        expect(report.nonDomesticCount).toBeGreaterThanOrEqual(0);
    }
    validateCategory(report: any): void {
        expect(["technical", "ynr"]).toContain(report.category);
    }
    validateBusinessRules(report: any): void {
        expect(report.totalCount).toBeGreaterThanOrEqual(report.domesticCount);
        expect(report.totalCount).toBeGreaterThanOrEqual(report.nonDomesticCount);
    }
    validateZeroCountLogic(report: any): void {
        if (report.totalCount === 0) {
            expect(report.domesticCount).toBe(0);
            expect(report.nonDomesticCount).toBe(0);
        }
    }
    validateEmptyStrings(report: any): void {
        expect(report.analysisType.trim().length).toBeGreaterThan(0);
        expect(report.reportName.trim().length).toBeGreaterThan(0);
    }
    validateDuplicateAnalysisTypes(reports: any[]): void {
        const analysisTypes =reports.map(x => x.analysisType);
        expect(new Set(analysisTypes).size).toBe(analysisTypes.length);
    }
    validateTechnicalReports(reports: any[]): void {
        expect(reports.some(x =>x.category === "technical")).toBeTruthy();
    }
    validateYnrReports(reports: any[]): void {
        expect(reports.some(x =>x.category === "ynr")).toBeTruthy();
    }
}