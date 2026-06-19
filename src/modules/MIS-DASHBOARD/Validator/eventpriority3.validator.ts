import { expect } from "@playwright/test";
import { EventPriorityData } from "../Mapper/eventpriority3.mapper";
import { backendRules } from "../Data/eventpriority3.data";
type TrendPeriod =
    keyof typeof backendRules.trendRegex;
export class EventPriorityValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validatePriority(data: EventPriorityData) {
        expect(backendRules.priorityIds).toContain(data.priorityId);
        expect(data.label).toBe(`Priority ${data.priorityId}`);
    }
    validatePeriod(data: EventPriorityData) {
        expect(backendRules.periods).toContain(data.period);
    }
    validateDates(data: EventPriorityData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        if (data.period === "hourly") {
            expect(data.fromDate).toBe(data.toDate);
        }
    }
    validateTotals(data: EventPriorityData) {
        const total = data.records.reduce((sum, row) => sum + row.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validatePhaseLabels(data: EventPriorityData) {
        const labels =data.records.map(x => x.label);
        expect(labels).toEqual( backendRules.phaseLabels );
    }
    validateDuplicateLabels(data: EventPriorityData) {
        const labels =data.records.map(x => x.label);
        const duplicates =labels.filter((x, index) =>labels.indexOf(x)!== index);
        expect(duplicates).toEqual([]);
    }
    validatePercentages(data: EventPriorityData) {
        for (const row of data.records) {
            expect(Number(row.percentage)).not.toBeNaN();
            expect(Number(row.percentage)).toBeGreaterThanOrEqual(0);
            expect(Number(row.percentage)).toBeLessThanOrEqual(100);
            const expected =data.totalCount === 0 ? 0 : ( row.count / data.totalCount) * 100;
            expect(Number( row.percentage) ).toBeCloseTo(expected,2);
        }
    }
    validateTrendStructure(data: EventPriorityData) {
        const regex = backendRules.trendRegex[ data.period as TrendPeriod ];
        expect( regex ).toBeDefined();
        expect(data.trend.length).toBe(data.records.length);
        for ( const series of data.trend) {
            expect( series.name).toBeTruthy();
            series.data.forEach(point => {
                    expect(point.key).toMatch(regex);
                    expect(point.label).toBeTruthy();
                    expect(point.value).toBeGreaterThanOrEqual(0);
                });
        }
    }
    validateTrendNames(data: EventPriorityData) {
        const trendNames =data.trend.map(x => x.name);
        const labels =data.records.map(x => x.label);
        expect(trendNames).toEqual(labels);
    }
    validateTrendAggregation(data: EventPriorityData) {
        for ( const trend of data.trend) {
            const total =trend.data.reduce((sum, item) => sum + item.value, 0);
            const row =data.records.find(x => x.label ===trend.name);
            expect(total).toBe(row?.count);
        }
    }
    validateExpectedTrendCounts(data: EventPriorityData) {
        if (data.period === "hourly") {
            for (const x of data.trend) {
                expect(x.data.length).toBe(24);
            }
        }
        if (data.period === "weekly" ) {
            for ( const x of data.trend) {
                expect( x.data.length ).toBe(4);
            }
        }
    }
    validateBusinessInvestigation(data: EventPriorityData) {
        const findings = [];
        for ( const row  of data.records) {
            if ( row.count === 0 ) {
                findings.push({priority:data.priorityId,
                    phase:row.label,
                    issue:"No Events"
                });
            }
        }
        if (findings.length) {
            console.log("\nBACKEND INVESTIGATION");
            console.table(findings);
        }
    }
    validate(data: EventPriorityData) {
        this.validatePriority(data);
        this.validatePeriod(data);
        this.validateDates(data);
        this.validateTotals(data);
        this.validatePhaseLabels(data);
        this.validateDuplicateLabels(data);
        this.validatePercentages(data);
        this.validateTrendStructure(data);
        this.validateTrendNames(data);
        this.validateTrendAggregation(data);
        this.validateExpectedTrendCounts(data);
    }
}