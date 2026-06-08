import { expect } from "@playwright/test";
import {
    CommercialSummaryData,
    CommercialSummaryReport,
} from "../Mapper/commercial-summary.mapper";

const REPORT_REQUIRED_FIELDS = [
    "analysisType",
    "reportName",
    "category",
    "totalCount",
    "domesticCount",
    "nonDomesticCount",
] as const;

export class CommercialSummaryValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: CommercialSummaryData) {
        expect(typeof data.month).toBe("number");
        expect(typeof data.year).toBe("number");
        expect(Array.isArray(data.reports)).toBeTruthy();
    }

    validateMonth(month: number) {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
    }

    validateYear(year: number) {
        expect(year).toBeGreaterThan(2000);
        expect(year).toBeLessThan(2100);
    }

    validateQueryEcho(data: CommercialSummaryData, month: number, year: number) {
        expect(data.month).toBe(month);
        expect(data.year).toBe(year);
    }

    validateReportsExist(reports: CommercialSummaryReport[]) {
        expect(reports.length).toBeGreaterThan(0);
    }

    validateReportCount(reports: CommercialSummaryReport[], expectedCount: number) {
        expect(reports.length).toBe(expectedCount);
    }

    validateDuplicateAnalysisTypes(reports: CommercialSummaryReport[]) {
        const types = reports.map((r) => r.analysisType);
        expect(new Set(types).size).toBe(types.length);
    }

    validateExpectedAnalysisTypes(
        reports: CommercialSummaryReport[],
        expectedTypes: readonly string[],
    ) {
        const actualTypes = reports.map((r) => r.analysisType).sort();
        const sortedExpected = [...expectedTypes].sort();
        expect(actualTypes).toEqual(sortedExpected);
    }

    validateCommercialCategory(
        reports: CommercialSummaryReport[],
        expectedCategory: string,
    ) {
        reports.forEach((report) => {
            expect(report.category).toBe(expectedCategory);
        });
    }

    validateReportRequiredFields(report: CommercialSummaryReport) {
        REPORT_REQUIRED_FIELDS.forEach((field) => {
            expect(report).toHaveProperty(field);
        });
    }

    validateReportStructure(report: CommercialSummaryReport) {
        expect(typeof report.analysisType).toBe("string");
        expect(report.analysisType.trim().length).toBeGreaterThan(0);
        expect(typeof report.reportName).toBe("string");
        expect(report.reportName.trim().length).toBeGreaterThan(0);
        expect(typeof report.category).toBe("string");
        expect(typeof report.totalCount).toBe("number");
        expect(typeof report.domesticCount).toBe("number");
        expect(typeof report.nonDomesticCount).toBe("number");
    }

    validateReportCounts(report: CommercialSummaryReport) {
        expect(report.totalCount).toBeGreaterThanOrEqual(0);
        expect(report.domesticCount).toBeGreaterThanOrEqual(0);
        expect(report.nonDomesticCount).toBeGreaterThanOrEqual(0);
        expect(report.totalCount).toBeGreaterThanOrEqual(report.domesticCount);
        expect(report.totalCount).toBeGreaterThanOrEqual(report.nonDomesticCount);
    }

    validateZeroCountLogic(report: CommercialSummaryReport) {
        if (report.totalCount !== 0) {
            return;
        }
        expect(report.domesticCount).toBe(0);
        expect(report.nonDomesticCount).toBe(0);
    }

    validateReportNameMapping(
        report: CommercialSummaryReport,
        expectedNames: Record<string, string>,
    ) {
        const expected = expectedNames[report.analysisType];
        if (!expected) {
            return;
        }
        expect(report.reportName).toBe(expected);
    }

    validateNoNaN(report: CommercialSummaryReport) {
        expect(Number.isNaN(report.totalCount)).toBeFalsy();
        expect(Number.isNaN(report.domesticCount)).toBeFalsy();
        expect(Number.isNaN(report.nonDomesticCount)).toBeFalsy();
    }

    validateDomesticNonDomesticSplit(report: CommercialSummaryReport) {
        expect(
            report.domesticCount + report.nonDomesticCount,
        ).toBeLessThanOrEqual(report.totalCount);
    }

    validateBusinessRules(data: CommercialSummaryData) {
        expect(data).toHaveProperty("month");
        expect(data).toHaveProperty("year");
        expect(data).toHaveProperty("reports");
    }
}
