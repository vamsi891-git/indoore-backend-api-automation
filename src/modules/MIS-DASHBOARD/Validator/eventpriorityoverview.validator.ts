import { expect } from "@playwright/test";
import { backendRules } from "../Data/eventpriorityoverview.data";
import { EventPriorityOverviewData } from "../Mapper/eventpriorityoverview.mapper";
export class EventPriorityOverviewValidator {
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateDates(data: EventPriorityOverviewData) {
        const current =new Date(data.currentDate);
        const previous =new Date(data.previousDate);
        expect(current.getTime()).toBeGreaterThan(previous.getTime());
    }
    validatePriorityCount(data: EventPriorityOverviewData) {
        expect(data.priorities.length).toBe(backendRules.priorityCount);
    }
    validatePriorityIds(data: EventPriorityOverviewData) {
        const ids =data.priorities.map(x => x.priorityId);
        expect(ids).toEqual(backendRules.priorityIds);
    }
    validateLabels(data: EventPriorityOverviewData) {
        for (const row of data.priorities) {
            expect(row.label).toBe(`Priority ${row.priorityId}`);
        }
    }
    validateSorting(data: EventPriorityOverviewData) {
        const ids =data.priorities.map(x => x.priorityId);
        const sorted =[...ids].sort((a, b) => a - b);
        expect(ids).toEqual(sorted);
    }
    validateCurrentTotals(data: EventPriorityOverviewData) {
        const total =data.priorities.reduce((sum, row) =>sum + row.currentDay, 0);
        expect(total).toBe(data.totalEventsCurrentDay);
    }
    validatePreviousTotals(data: EventPriorityOverviewData) {
        const total = data.priorities.reduce((sum, row) => sum + row.previousDay, 0);
        expect(total).toBe(data.totalEventsPreviousDay);
    }
    validateNegativeValues(data: EventPriorityOverviewData) {
        for (const row  of data.priorities) {
            expect(row.currentDay).toBeGreaterThanOrEqual(0);
            expect(row.previousDay).toBeGreaterThanOrEqual(0);
        }
    }
    validateDuplicatePriority(data: EventPriorityOverviewData) {
        const ids =data.priorities.map(x => x.priorityId);
        const dup =ids.filter((x, index) =>ids.indexOf(x)!== index);
        expect(dup).toEqual([]);
    }
    validateBusinessInvestigation(data: EventPriorityOverviewData) {
        const findings = [];
        for (const row of data.priorities) {
            if ( row.currentDay === 0 && row.previousDay === 0 ) {
                findings.push({
                    priority:row.priorityId,
                    issue:"No events"
                });
            }
        }
        if (findings.length) {
            console.log("\nBACKEND INVESTIGATION");
            console.table(findings);
        }
    }
    validate(data: EventPriorityOverviewData) {
        this.validateDates(data);
        this.validatePriorityCount(data);
        this.validatePriorityIds(data);
        this.validateLabels(data);
        this.validateSorting(data);
        this.validateCurrentTotals(data);
        this.validatePreviousTotals(data);
        this.validateNegativeValues(data);
        this.validateDuplicatePriority(data);
    }
}