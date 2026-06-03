import { expect }  from "@playwright/test";
import { backendRules } from "../Data/eventdatapower.data";
import { EventPowerData } from "../Mapper/eventdatapower.mapper";
type TrendPeriod = keyof typeof backendRules.trendRegex;
export class EventPowerValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateReportType(data: EventPowerData) {
        expect(backendRules.reportTypes).toContain(data.reportType);
    }
    validatePeriod(data: EventPowerData) {
        expect(backendRules.periods).toContain(data.period);
    }
    validateDates(data: EventPowerData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        if (data.period === "hourly") {
            expect(data.fromDate).toBe(data.toDate);
        }
    }
    validateCategory(data: EventPowerData) {
        expect(data.category).toBe("power");
        expect(data.label).toBe("Power");
    }
    validateTotals(data: EventPowerData) {
        const total =data.records.reduce((sum, item) => sum + item.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validateStructure(data: EventPowerData) {
        const labels: string[] = [];
        for (const row of data.records) {
            expect(row.label).toBeTruthy();
            expect(row.count).toBeGreaterThanOrEqual(0);
            expect(Number(row.percentage)
            ).not.toBeNaN();
            labels.push(
                row.label
            );
        }
        const duplicates =labels.filter((x, i) =>labels.indexOf(x) !== i);
        expect(duplicates).toEqual([]);
        const expected =data.reportType === "phase-wise"  ?backendRules.phaseLabels : backendRules.categoryLabels;
        expect(labels).toEqual(expected);
    }
    validatePercentages(data: EventPowerData) {
        for (const row of data.records) {
            const expected =data.totalCount === 0 ? 0 :(row.count /data.totalCount)* 100;
            expect(Number(row.percentage)).toBeCloseTo(expected,2);
        }
    }
    validateTrend(data: EventPowerData) {
        const regex =backendRules.trendRegex[data.period as TrendPeriod];
        expect(data.trend.length).toBe(data.records.length);
        for (const series of data.trend ) {
            expect(series.name).toBeTruthy();
            series.data.forEach(point => {
                expect(point.key).toMatch(regex);
                    expect(point.label).toBeTruthy();
                    expect(point.value).toBeGreaterThanOrEqual(0);
                });
        }
    }
    validateTrendSeriesNames(data: EventPowerData) {
        expect(data.trend.map(x => x.name)).toEqual(data.records.map(x => x.label)
    );
    }
    validateTrendPointCounts(data: EventPowerData) {
        const expected =backendRules.trendExpectedCount[data.period as keyof typeof backendRules.trendExpectedCount];
        if (!expected)
            return;
        for (const series of data.trend) {
            expect(series.data.length).toBe(expected);
        }
    }
    validateBusinessAnomalies(data: EventPowerData) {
        const findings = [];
        for (const row of data.records) {
            if (row.count === 0) {
                findings.push({reportType:data.reportType,
                    period:data.period,
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
    validate(data: EventPowerData) {
        this.validateReportType(data);
        this.validatePeriod(data);
        this.validateDates(data);
        this.validateCategory(data);
        this.validateTotals(data);
        this.validateStructure(data);
        this.validatePercentages(data);
        this.validateTrend(data);
        this.validateTrendSeriesNames(data);
        this.validateTrendPointCounts(data);
    }
}