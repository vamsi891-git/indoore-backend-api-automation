import { expect } from "@playwright/test";
import { PriorityOverviewData, PriorityOverviewResponse }  from "../Mapper/priority-overview.mapper";
export class PriorityOverviewValidator {
    validateResponse( response:  PriorityOverviewResponse) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateDates(data:PriorityOverviewData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
    }
    validatePrioritiesExist(data:PriorityOverviewData) {
        expect(data.priorities.length).toBeGreaterThan(0);
    }
    validatePriorityStructure(data:PriorityOverviewData) {
        const ids =new Set<number>();
        for (const item of data.priorities) {
            expect(item.priorityId).toBeGreaterThan(0);
            expect(item.priorityLabel).toMatch(/^P\d+$/);
            expect(item.events).toBeGreaterThanOrEqual(0);
            expect(ids.has(item.priorityId)).toBeFalsy();
            ids.add(item.priorityId);
        }
    }
    validatePriorityOrdering(data:PriorityOverviewData) {
        for (let i = 1;i <data.priorities.length;i++) {
            expect(data.priorities[i].priorityId).toBeGreaterThan(
                    data.priorities[ i - 1].priorityId
                );
        }
    }
    validateExpectedPriorities(data:PriorityOverviewData) {
        const expected = [1, 2, 3, 4, 5, 6];
        const actual = data.priorities .map(x => x.priorityId);
        expect(actual).toEqual(expected);
    }
}