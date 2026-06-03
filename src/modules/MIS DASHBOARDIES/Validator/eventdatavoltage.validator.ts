import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventdatavoltage.data";
import { EventVoltageData } from "../Mapper/eventdatavoltage.mapper";

type TrendPeriod = keyof typeof backendRules.trendRegex;

export class EventVoltageValidator {

    validateResponse(response: { success: boolean; data: unknown }) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }

    validateReportType(data: EventVoltageData) {
        expect(backendRules.reportTypes)
            .toContain(data.reportType);
    }

    validatePeriod(data: EventVoltageData) {
        expect(backendRules.periods)
            .toContain(data.period);
    }

    validateDates(data: EventVoltageData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from = new Date(data.fromDate);
        const to = new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        if (data.period === "hourly") {
            expect(data.fromDate).toBe(data.toDate);
        }
    }
    validateNotEmpty(data: EventVoltageData) {
        expect(data.records.length).toBeGreaterThan(0);
        expect(data.trend.length).toBeGreaterThan(0);
    }
    validateTotals(data: EventVoltageData) {
        const total =data.records.reduce((sum, item) => sum + item.count,0);
        expect(total).toBe(data.totalCount);
    }
    validateStructure(data: EventVoltageData) {
        const labels: string[] = [];
        for (const row of data.records) {
            expect(row.label).toBeTruthy();
            expect(row.count).toBeGreaterThanOrEqual(0);
            expect(Number(row.percentage)).not.toBeNaN();
            labels.push(row.label);
        }
        const duplicates =labels.filter((item, index) =>labels.indexOf(item) !== index);
        expect(duplicates).toEqual([]);
        const expected =data.reportType === "phase-wise"? backendRules.phaseLabels : backendRules.categoryLabels;
        expect(labels).toEqual(expected);
    }
    validatePercentages(data: EventVoltageData) {
        for (const row of data.records) {
            const expected =data.totalCount === 0 ? 0 : (row.count /data.totalCount) * 100;
            expect(Number(row.percentage)).toBeCloseTo(expected,2);
        }
    }
    validateTrend(data: EventVoltageData) {
        const regex =backendRules.trendRegex[data.period as TrendPeriod];
        expect(regex).toBeDefined();
        expect(data.trend.length).toBe(data.records.length);
        for (const series of data.trend) {
            expect(series.name).toBeTruthy();
            series.data.forEach(point => {
                expect(point.key).toMatch(regex);
                expect(point.label).toBeTruthy();
                expect(point.value).toBeGreaterThanOrEqual(0);
            });
        }
    }
    validateTrendSeriesNames(data: EventVoltageData) {
        const phaseNames =data.records.map(x => x.label);
        const trendNames =data.trend.map(x => x.name);
        expect(trendNames).toEqual(phaseNames);
    }
    validateTrendAggregation(data: EventVoltageData) {
        for (const series of data.trend) {
            const trendTotal =series.data.reduce((sum, item) =>sum + item.value,0);
            const record =data.records.find(x =>x.label ===series.name);
            expect(trendTotal).toBe(record?.count);
        }
    }
    validateTrendPointCounts(data: EventVoltageData) {
        const expectedCounts = {hourly: 24,weekly: 4
        };
        const expected =expectedCounts[data.period as keyof typeof expectedCounts];
        if (!expected) return;
        for (const series of data.trend) {
            expect(series.data.length ).toBe(expected);
        }
    }
    validateBusinessAnomalies(data: EventVoltageData) {
        const findings: Array<{
            period: string;
            reportType: string;
            label: string;
            issue: string;
        }> = [];
        for (const row of data.records) {
            if (row.count === 0) {
                findings.push({
                    period:data.period,
                    reportType:data.reportType,
                    label:row.label,
                    issue:"No events"
                });
            }
        }
        if (findings.length) {
            console.log("\nBACKEND INVESTIGATION");
            console.table(findings);
        }
    }
    validate(data: EventVoltageData) {
        this.validateReportType(data);
        this.validatePeriod(data);
        this.validateDates(data);
        this.validateNotEmpty(data);
        this.validateTotals(data);
        this.validateStructure(data);
        this.validatePercentages(data);
        this.validateTrend(data);
        this.validateTrendSeriesNames(data);
        this.validateTrendAggregation(data);
        this.validateTrendPointCounts(data);
    }
}