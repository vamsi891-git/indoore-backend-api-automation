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

const REPORT_ALLOWED_FIELDS = new Set([
    "analysisType",
    "reportName",
    "category",
    "totalCount",
    "domesticCount",
    "nonDomesticCount",
]);

const ANALYSIS_TYPE_PATTERN = /^[a-z][a-z0-9_]*$/;

export class CommercialSummaryValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: CommercialSummaryData) {
        expect(typeof data.month).toBe("number");
        expect(typeof data.year).toBe("number");
        expect(Array.isArray(data.reports)).toBeTruthy();
        expect(Number.isInteger(data.month)).toBeTruthy();
        expect(Number.isInteger(data.year)).toBeTruthy();
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

    validateReportsOrder(
        reports: CommercialSummaryReport[],
        expectedOrder: readonly string[],
    ) {
        const actualOrder = reports.map((r) => r.analysisType);
        expect(actualOrder).toEqual([...expectedOrder]);
    }

    validateReportGroupsPresent(
        reports: CommercialSummaryReport[],
        groups: Record<string, readonly string[]>,
    ) {
        const types = new Set(reports.map((r) => r.analysisType));
        Object.entries(groups).forEach(([groupName, members]) => {
            members.forEach((type) => {
                expect(types.has(type), `Missing ${type} in group ${groupName}`).toBe(
                    true,
                );
            });
        });
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

    validateReportFieldWhitelist(report: CommercialSummaryReport) {
        Object.keys(report).forEach((key) => {
            expect(REPORT_ALLOWED_FIELDS.has(key)).toBeTruthy();
        });
    }

    validateReportStructure(report: CommercialSummaryReport) {
        expect(typeof report.analysisType).toBe("string");
        expect(report.analysisType.trim().length).toBeGreaterThan(0);
        expect(ANALYSIS_TYPE_PATTERN.test(report.analysisType)).toBeTruthy();
        expect(typeof report.reportName).toBe("string");
        expect(report.reportName.trim().length).toBeGreaterThan(0);
        expect(typeof report.category).toBe("string");
        expect(report.category.trim().length).toBeGreaterThan(0);
        expect(typeof report.totalCount).toBe("number");
        expect(typeof report.domesticCount).toBe("number");
        expect(typeof report.nonDomesticCount).toBe("number");
    }

    validateIntegerCounts(report: CommercialSummaryReport) {
        expect(Number.isInteger(report.totalCount)).toBeTruthy();
        expect(Number.isInteger(report.domesticCount)).toBeTruthy();
        expect(Number.isInteger(report.nonDomesticCount)).toBeTruthy();
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

    /** Backend: night reports return hardcoded zeros until day/night LP integration */
    validateNightReportsPlaceholder(
        reports: CommercialSummaryReport[],
        expectedZeroTypes: readonly string[],
    ) {
        expectedZeroTypes.forEach((type) => {
            const report = reports.find((r) => r.analysisType === type);
            expect(report, `Missing night report: ${type}`).toBeDefined();
            expect(report!.totalCount).toBe(0);
            expect(report!.domesticCount).toBe(0);
            expect(report!.nonDomesticCount).toBe(0);
        });
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

    validateNoNullishCounts(report: CommercialSummaryReport) {
        expect(report.totalCount).not.toBeNull();
        expect(report.domesticCount).not.toBeNull();
        expect(report.nonDomesticCount).not.toBeNull();
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

    validateAggregateTotals(reports: CommercialSummaryReport[]) {
        const sumTotal = reports.reduce((acc, r) => acc + r.totalCount, 0);
        expect(sumTotal).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(sumTotal)).toBeTruthy();
    }

    /**
     * When scope has data, pf_violation and lf_gt_100 often have non-zero totals
     * (billing archive). Soft check — logs only when both are zero.
     */
    validateLikelyDataPresence(reports: CommercialSummaryReport[]) {
        const pf = reports.find((r) => r.analysisType === "pf_violation");
        const lfHigh = reports.find((r) => r.analysisType === "lf_gt_100");
        if (pf && lfHigh && pf.totalCount === 0 && lfHigh.totalCount === 0) {
            console.log(
                "BACKEND FINDING: pf_violation and lf_gt_100 both zero — empty scope or archive?",
            );
        }
    }
}
