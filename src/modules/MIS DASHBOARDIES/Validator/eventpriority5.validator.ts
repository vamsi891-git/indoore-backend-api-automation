import { expect } from "@playwright/test";
import { EventPriorityData } from "../Mapper/eventpriority5.mapper";
import { backendRules } from "../Data/eventpriority5.data";
type TrendPeriod = keyof typeof backendRules.trendRegex;
export class EventPriorityValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validatePriority(data: EventPriorityData) {
        expect(backendRules.priorityIds).toContain(data.priorityId);
        expect(data.label).toBe(`Priority ${data.priorityId}`)
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
        const total =data.records.reduce((sum, row) =>sum + row.count, 0);
        expect(total).toBe(data.totalCount);
    }
    validatePhaseLabels(data: EventPriorityData) {
        const labels =data.records.map(x => x.label);
        expect(labels).toEqual(backendRules.phaseLabels);
    }
    validateTrendStructure(data: EventPriorityData) {
        expect(data.trend.length).toBe(data.records.length);
        for (const trend of data.trend) {
            expect(trend.name).toBeTruthy();
        }
    }
    validateTrendNames(data: EventPriorityData) {
        const phaseLabels =data.records.map(x => x.label);
        const trendLabels =data.trend.map(x => x.name);
        expect(trendLabels).toEqual(phaseLabels);
    }
    validateHourlySlots(data: EventPriorityData) {
        if (data.period === "hourly") {
            for (const row of data.trend
            ) {
            expect(row.data.length).toBe(24);
            }
        }
    }
    validateTrendRegex(data: EventPriorityData) 
    {
        const regex =backendRules.trendRegex[data.period as TrendPeriod];
        for (const row of data.trend) {
            row.data.forEach(point => {
                    expect(point.key).toMatch(regex);
                });
        }
    }
    validateTrendAggregation(data: EventPriorityData) {
        for ( const trend of data.trend) {
            const total = trend.data.reduce((sum, item) => sum + item.value, 0);
            const phase =data.records.find(x =>x.label === trend.name);
            expect(total).toBe(phase?.count);
        }
    }
    validateDuplicateLabels(data: EventPriorityData) {
        const labels =data.records.map(x => x.label);
        const dup =labels.filter((x, index) =>labels.indexOf(x) !== index);
        expect(dup).toEqual([]);
    }
    validateBusinessInvestigation(data: EventPriorityData) {
        const findings = [];
        for ( const row of data.records) {
            if ( row.count === 0 ) {
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
        this.validateTrendStructure(data);
        this.validateTrendNames(data);
        this.validateHourlySlots(data);
        this.validateTrendRegex(data);
        this.validateTrendAggregation(data);
        this.validateDuplicateLabels(data);
    }
}