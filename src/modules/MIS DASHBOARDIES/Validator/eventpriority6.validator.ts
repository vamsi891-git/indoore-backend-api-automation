import { expect } from "@playwright/test";
import { EventPriorityData } from "../Mapper/eventpriority6.mapper";
import { backendRules } from "../Data/eventpriority6.data";
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
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        if (data.period === "hourly") {
            expect(data.fromDate).toBe(data.toDate);
        }
    }
    validateTotals(data: EventPriorityData) {
        const total =data.records.reduce((sum, row) =>sum + row.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validatePhaseLabels(data: EventPriorityData) {
        expect(data.records.map(x => x.label) ).toEqual(backendRules.phaseLabels);
    }
    validateDuplicateLabels(data: EventPriorityData) {
        const labels =data.records.map(x => x.label);
        const duplicate =labels.filter((x, index) =>labels.indexOf(x)!== index);
        expect(duplicate).toEqual([]);
    }
    validatePercentages(data: EventPriorityData) {
        for (const row of data.records) {
            const expected =data.totalCount === 0 ? 0 : (row.count / data.totalCount)* 100;
            expect(Number( row.percentage )).toBeCloseTo(expected,2);
        }
    }
    validateTrend(data: EventPriorityData) {
        const regex =backendRules.trendRegex[data.period as TrendPeriod];
        for (const series of data.trend) {
            expect(series.name).toBeTruthy();
            series.data.forEach(point => {
                    expect(point.key).toMatch(regex);
                    expect(point.value).toBeGreaterThanOrEqual(0);
                });
        }
    }
    validateHourlySlots(data: EventPriorityData) {
        if (data.period === "hourly") {
            for (const x of data.trend) {
                expect(x.data.length).toBe(24);
            }
        }
    }
    validateBusinessInvestigation(data: EventPriorityData) {
      const findings = [];for (const row of data.records ) {
            if (row.count === 0) {
                findings.push({
                    priority:data.priorityId,
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
        this.validatePriority(data);
        this.validatePeriod(data);
        this.validateDates(data);
        this.validateTotals(data);
        this.validatePhaseLabels(data);
        this.validateDuplicateLabels(data);
        this.validatePercentages(data);
        this.validateTrend(data);
        this.validateHourlySlots(data);
    }
}