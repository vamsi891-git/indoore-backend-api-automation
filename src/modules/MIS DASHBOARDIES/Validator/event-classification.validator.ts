import { expect } from "@playwright/test";
import { EventClassificationData, EventClassificationResponse } from "../Mapper/event-classification.mapper";
import { backendRules, labelMappings } from "../Data/event-classification.data";
export class EventClassificationValidator {
    validateResponse(response: EventClassificationResponse) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateReportType( data: EventClassificationData) {
        expect(backendRules.reportTypes).toContain(data.reportType);
    }
    validateDates(data: EventClassificationData) {
        expect(data.currentDate).toBeTruthy();
        expect(data.previousDate ).toBeTruthy();
        const current =new Date(data.currentDate);
        const previous =new Date(data.previousDate)
        expect(current.getTime()).toBeGreaterThan(previous.getTime());
    }
    validateTotals(data: EventClassificationData) {
        const currentTotal =data.classifications.reduce ((sum, item) => sum + item.currentDay,0);
        const previousTotal =data.classifications.reduce((sum, item) =>sum + item.previousDay, 0);
        expect(currentTotal).toBe(data.totalEventsCurrentDay);
        expect(previousTotal).toBe(data.totalEventsPreviousDay);
    }
    validateClassifications(data: EventClassificationData) {
        expect(data.classifications.length).toBeGreaterThan(0);
        const duplicates =new Set();
        for (const item of data.classifications) {
            expect(item.category).toBeTruthy();
            expect(item.label).toBeTruthy();
            expect(item.currentDay).toBeGreaterThanOrEqual(0);
            expect(item.previousDay).toBeGreaterThanOrEqual(0);
            expect(duplicates.has(item.category)).toBeFalsy();
            duplicates.add(item.category);
        }
    }
    validateBackendLogic(data: EventClassificationData) {
        const actual = data.classifications.map(x => x.category);
        expect(actual).toEqual(backendRules.expectedCategories);
    }
    validateLabelMappings(data: EventClassificationData) {
        for (const row of data.classifications) {
            expect( row.label).toBe(labelMappings[row.category as keyof typeof labelMappings] );
        }
    }
    validateBusinessAnomalies(data: EventClassificationData) {
        const findings = [];
        for ( const row of data.classifications ) {
            if ( row.currentDay === 0 && row.previousDay === 0) {
                findings.push({category:row.category,issue:"No event data"
                });
            }
        }
        console.table(
            findings
        );
    }
    validate(data: EventClassificationData) {
        this.validateReportType(data);
        this.validateDates(data);
        this.validateTotals(data);
        this.validateClassifications(data);
        this.validateBackendLogic(data);
        this.validateLabelMappings(data);
        this.validateBusinessAnomalies(data);
    }
}