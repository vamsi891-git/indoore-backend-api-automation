import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventdatanonrollover.data";
import { EventNonRolloverData } from "../Mapper/eventdatanonrollover.mapper";
type TrendPeriod =
    keyof typeof backendRules.trendRegex;
export class EventNonRolloverValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateReportType(data: EventNonRolloverData) {
        expect(backendRules.reportTypes).toContain(data.reportType);
    }
    validatePeriod(data: EventNonRolloverData) {
        expect(backendRules.periods).toContain(data.period);
    }
    validateCategory(data: EventNonRolloverData) {
        expect(data.category).toBe("non-rollover-control");
        expect(data.label).toBe("NonRollover");
    }
    validateDates(data: EventNonRolloverData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        if (data.period === "hourly") {
            expect(data.fromDate).toBe(data.toDate);
        }
    }
    validateTotalAggregation(data: EventNonRolloverData) {
        const total =data.records.reduce((sum, item) =>sum + item.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validateStructure(data: EventNonRolloverData) {
        const labels: string[] = [];
        for (const row of data.records) {
            expect(row.label).toBeTruthy();
            expect(row.count).toBeGreaterThanOrEqual(0);
            expect(Number(row.percentage)).not.toBeNaN();
            labels.push(
                row.label
            );
        }
        const expected =data.reportType === "phase-wise"? backendRules.phaseLabels : backendRules.categoryLabels;
        expect(labels).toEqual(expected);
    }
    validateDuplicates(data: EventNonRolloverData) {
        const labels =data.records.map(x => x.label);
        const duplicates =labels.filter((x, index) =>labels.indexOf(x)!== index);
        expect(duplicates).toEqual([]);
    }
    validatePercentageCalculation(data: EventNonRolloverData) {
        for (const row of data.records) {
            const expected =data.totalCount === 0 ? 0 : ( row.count / data.totalCount ) * 100;
            expect(Number(row.percentage)).toBeCloseTo(expected,2);
        }
    }
    validateTrendStructure(data: EventNonRolloverData) {
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
    validateTrendNames(data: EventNonRolloverData) {
        const records =data.records.map(x => x.label);
        const trends =data.trend.map(x => x.name);
        expect(trends).toEqual(records);
    }
    validateTrendAggregation(data: EventNonRolloverData) {
        for (const series of data.trend) {
            const total = series.data.reduce( (sum, item) => sum + item.value, 0);
            const row =data.records.find(x => x.label === series.name);
            expect(total).toBe(row?.count);
        }
    }
    validateTrendCounts(data: EventNonRolloverData) {
        const expected = {
            hourly: 24,
            weekly: 4
        };
        const count =expected[data.period as keyof typeof expected ];
        if (!count) return;
        for (const series of data.trend) {
            expect(series.data.length).toBe(count);
        }
    }
    validateBusinessFindings(data: EventNonRolloverData) {
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
    validate(data: EventNonRolloverData) {
        this.validateReportType(data);
        this.validatePeriod(data);
        this.validateCategory(data);
        this.validateDates(data);
        this.validateTotalAggregation(data);
        this.validateStructure(data);
        this.validateDuplicates(data);
        this.validatePercentageCalculation(data);
        this.validateTrendStructure(data);
        this.validateTrendNames(data);
        this.validateTrendAggregation(data);
        this.validateTrendCounts(data);
    }
}