import { expect }  from "@playwright/test";
import { EventPriorityData } from "../Mapper/eventpriority2.mapper";
import { backendRules } from "../Data/eventpriority2.data";
type TrendPeriod = keyof typeof backendRules.trendRegex;
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
    validateTotals(data: EventPriorityData) {
        const total =data.records.reduce((sum, row) => sum + row.count,0);
        expect(total).toBe(data.totalCount);
    }
    validatePhaseLabels(data: EventPriorityData) {
        expect(data.records.map(x => x.label)).toEqual(backendRules.phaseLabels);
    }
    validatePercentages(data: EventPriorityData) {
        for (const row of data.records) {
            const expected = data.totalCount === 0 ? 0 : (row.count/data.totalCount)* 100;
            expect(Number(row.percentage)).toBeCloseTo(expected,2);
        }
    }
    validateTrend(data: EventPriorityData) {
        const regex = backendRules.trendRegex[data.period as TrendPeriod];
        for (const trend of data.trend) {
            for (const x of trend.data) {
                expect(x.key).toMatch(regex);
            }
        }
    }
    validateTrendAggregation(data: EventPriorityData) {
        for (const trend of data.trend) {
            const total =trend.data.reduce((sum, item) => sum + item.value,0);
            const row =data.records.find(x =>x.label ===trend.name);
            expect(total).toBe(row?.count);
        }
    }
    validateTrendCounts(data: EventPriorityData) {
        for (const x of data.trend) {
            if (data.period === "hourly") {
                expect(x.data.length).toBe(24);
            }
            if (data.period === "daily") {
                expect(x.data.length).toBeGreaterThanOrEqual(28);
                expect(x.data.length).toBeLessThanOrEqual(31);
            }
            if (data.period === "weekly") {
                expect(x.data.length).toBe(4);
            }
        }
    }
    validateBackendInvestigation(data: EventPriorityData) {
        const findings = [];
        if (data.totalCount === 0) {
            findings.push({priority:data.priorityId,
                issue:"Possible scope filtering"
            });
        }
        if (findings.length) {
            console.log("\nBACKEND INVESTIGATION");
            console.table(findings);
        }
    }
    validate(data: EventPriorityData) {
        this.validatePriority(data);
        this.validatePeriod(data);
        this.validateTotals(data);
        this.validatePhaseLabels(data);
        this.validatePercentages(data);
        this.validateTrend(data);
        this.validateTrendAggregation(data);
        this.validateTrendCounts(data);
    }
}