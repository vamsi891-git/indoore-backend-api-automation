import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventpriority.data";
import { EventPriorityData } from "../Mapper/eventpriority.mapper";
type TrendPeriod = keyof typeof backendRules.trendRegex;
export class EventPriorityValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validatePriorityId(data: EventPriorityData) {
        expect(backendRules.priorityId).toContain(data.priorityId);
    }
    validateLabel(data: EventPriorityData) {
        expect(data.label).toBe(`Priority ${data.priorityId}`);
    }
    validateDates(data: EventPriorityData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(to.getTime()).toBeGreaterThanOrEqual(from.getTime() );
    }
    validateTotals(data: EventPriorityData) {
        const total =data.records.reduce((sum, x) => sum + x.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validatePhaseStructure(data: EventPriorityData) {
        const labels =data.records.map(x => x.label);
        expect(labels).toEqual(backendRules.phaseLabels);
    }
    validatePercentages(data: EventPriorityData) {
        for (const row of data.records) {
            expect(Number(row.percentage)).not.toBeNaN();
            expect(Number(row.percentage)).toBeGreaterThanOrEqual(0);
            expect(Number(row.percentage)).toBeLessThanOrEqual(100);
        }
    }
    validateTrend(data: EventPriorityData) {
        const regex =backendRules.trendRegex[data.period as TrendPeriod ];
        for (const series of data.trend) {
            expect(series.name).toBeTruthy();
            series.data.forEach(point => {
                    expect(point.key).toMatch(regex);
                    expect(point.label).toBeTruthy();
                    expect(point.value).toBeGreaterThanOrEqual(0);
                }
            );
        }
    }
    validateTrendCounts(data: EventPriorityData) {
        if (data.period === "hourly") {
            for (const s of data.trend) {
                expect(s.data.length).toBe(24);
            }
        }
        if (data.period === "weekly") {
            for (const s of data.trend) {
                expect( s.data.length).toBe(4 );
            }
        }
    }
    validateBusinessFindings(data: EventPriorityData) {
        const findings = [];
        for ( const row of data.records) {
            if (row.count === 0) {
                findings.push({
                    phase:row.label,
                    issue:"No events"
                });
            }
        }
        if (findings.length) {
            console.log("\nBACKEND INVESTIGATION");
            console.table(findings);
        }
    }
    validate(data: EventPriorityData) {
        this.validatePriorityId(data);
        this.validateLabel(data);
        this.validateDates(data);
        this.validateTotals(data);
        this.validatePhaseStructure(data);
        this.validatePercentages(data);
        this.validateTrend(data);
        this.validateTrendCounts(data);
    }
}