import { expect } from "@playwright/test";
import { CommStatsData, CommStatsResponse } from "../Mapper/communicationstats.mapper";
export class CommStatsValidator {
    validateResponse(response:CommStatsResponse) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    validateDates(data:CommStatsData) {
        expect(data.fromDate).toBeTruthy();
        expect(data.toDate).toBeTruthy();
        expect(data.referenceDate).toBeTruthy();
        const from =new Date(data.fromDate);
        const to =new Date(data.toDate);
        const ref =new Date(data.referenceDate);
        expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
        expect(ref.getTime()).toBeGreaterThanOrEqual(from.getTime());
        expect(ref.getTime()).toBeLessThanOrEqual(to.getTime());
    }
    validateMeterCounts(data:CommStatsData) {
        expect(data.totalMeters.value).toBeGreaterThanOrEqual(0);
        expect(data.activeMeters.value).toBeGreaterThanOrEqual(0);
        expect(data.nonOperationalMeters.value).toBeGreaterThanOrEqual(0);
        expect(data.unmappedMeters.value).toBeGreaterThanOrEqual(0);
    }
    validateRelationships(data:CommStatsData) {
        expect(data.activeMeters.value).toBeLessThanOrEqual(data.totalMeters.value);
        expect(data.nonOperationalMeters.value).toBeLessThanOrEqual(data.totalMeters.value);
        expect(data.unmappedMeters.value).toBeLessThanOrEqual(data.totalMeters.value);
    }
    validateAggregation(data:CommStatsData) {
        expect(data.activeMeters.value + data.unmappedMeters.value).toBe(data.totalMeters.value);
    }
    validatePreviousValues(data: CommStatsData) {
        const previous = [ data.totalMeters.previous, data.activeMeters.previous, data.nonOperationalMeters.previous, data.unmappedMeters.previous];
        for (const value of previous) {
            expect(value).not.toBeNull();
            expect(Number.isNaN(value)).toBeFalsy();
        }
    }
}   