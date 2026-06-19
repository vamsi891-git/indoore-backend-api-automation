import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventdatatransaction.data";
type TrendPeriod = keyof typeof backendRules.trendRegex;
export class EventTransactionValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateReportType(data: any) {
        expect(backendRules.reportTypes).toContain(data.reportType);
    }
    validatePeriod(data: any) {
        expect(backendRules.periods).toContain(data.period);
    }
    validateDates(data: any) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        if (data.period === "hourly") {
            expect(data.fromDate).toBe(data.toDate);
        }
    }
    validateTransactionMeta(data: any) {
        expect(data.category).toBe("transaction");
        expect(data.label).toBe("Transaction");
    }
    validateTotals(data: any) {
        const total =data.records.reduce((a: any, b: any) =>a + b.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validateRecordStructure(data: any) {
        const labels: string[] = [];
        for (const row of data.records) {
            expect(row.label).toBeTruthy();
            expect(row.count).toBeGreaterThanOrEqual(0);
            expect(Number(row.percentage)).not.toBeNaN();
            labels.push(row.label);
        }
        const expected =
            data.reportType === "phase-wise"?backendRules.phaseLabels:backendRules.categoryLabels;
        expect(labels).toEqual(expected);
    }
    validatePercentageLogic(data: any) {
        for ( const row of data.records) {
            const expected =
                data.totalCount === 0 ? 0  : ( row.count / data.totalCount) * 100;
            expect(Number(row.percentage)).toBeCloseTo(expected,2);
        }
    }
    validateTrend(data: any) {
        expect(data.trend.length).toBe(data.records.length);
        const regex =backendRules.trendRegex[data.period as TrendPeriod];
        for (const series of data.trend) {
            expect( series.name).toBeTruthy();
            series.data.forEach((point: any) => {
                    expect(point.key ).toMatch( regex);
                    expect(point.label).toBeTruthy();
                    expect(point.value).toBeGreaterThanOrEqual(0);
                });
        }
    }
    validateSeriesMatch(data: any) {
        expect(data.trend.map((x: any) => x.name)).toEqual(
                data.records.map((x: any) => x.label)
            );
    }
    validateTrendCounts(data: any) {
        const expected =backendRules.expectedTrendCount[data.period as keyof typeof backendRules.expectedTrendCount];
        if (!expected)
            return;
        for (const row of data.trend
        ) {
            expect(row.data.length).toBe(expected);
        }
    }
    validateAnomalies(data: any) {
        const issues = [];
        for (const row of data.records) {
            if ( row.count === 0) {
                issues.push({
                    reportType: data.reportType,
                    period: data.period,
                    label: row.label,
                    issue:"No Transactions"
                });
            }
        }
        if (issues.length) {
            console.table(issues);
        }
    }
    validate(data: any) {
        this.validateReportType(data);
        this.validatePeriod(data);
        this.validateDates(data);
        this.validateTransactionMeta(data);
        this.validateTotals(data);
        this.validateRecordStructure(data);
        this.validatePercentageLogic(data);
        this.validateTrend(data);
        this.validateSeriesMatch(data);
        this.validateTrendCounts(data);
    }
}   