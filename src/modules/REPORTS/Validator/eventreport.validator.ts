import { expect } from "@playwright/test";
import {
    EventReportData,
    EventReportItem,
    EventReportResponse,
} from "../Mapper/eventreport.mapper";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DURATION_HH_MM = /^\d+:\d{2}$/;

function parseIsoDate(value: string): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function parseDurationHhMm(value: string): { hours: number; minutes: number } {
    const [hours, minutes] = value.split(":").map(Number);
    return { hours, minutes };
}

export class EventReportValidator {
    validateSuccess(response: EventReportResponse) {
        expect(response.success).toBeTruthy();
    }

    validateRootStructure(response: EventReportResponse) {
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data.items)).toBeTruthy();
        expect(response.data.appliedFilters).toBeDefined();
    }

    validateQueryEcho(
        data: EventReportData,
        fromDate: string,
        toDate: string,
    ) {
        expect(data.fromDate).toBe(fromDate);
        expect(data.toDate).toBe(toDate);
    }

    validateDateRangeFormat(data: EventReportData) {
        expect(ISO_DATE.test(data.fromDate)).toBeTruthy();
        expect(ISO_DATE.test(data.toDate)).toBeTruthy();
        expect(parseIsoDate(data.fromDate).getTime()).toBeLessThanOrEqual(
            parseIsoDate(data.toDate).getTime(),
        );
    }

    validateScopedMeterCount(data: EventReportData) {
        expect(data.scopedMeterCount).toBeGreaterThanOrEqual(0);

        if (data.items.length > 0) {
            const maxMeterCount = Math.max(
                ...data.items.map((item) => item.meterCount),
            );
            expect(data.scopedMeterCount).toBeGreaterThanOrEqual(maxMeterCount);
        }
    }

    validateAppliedFilters(
        data: EventReportData,
        organisationLookupId: number,
    ) {
        const filters = data.appliedFilters;

        expect(filters).toHaveProperty("organisationLookupId");
        expect(filters).toHaveProperty("networkLookupId");
        expect(filters).toHaveProperty("servicePointMeterPhaseTblRefId");
        expect(filters).toHaveProperty("categoryTblRefId");
        expect(filters).toHaveProperty("priorityTblRefId");
        expect(filters).toHaveProperty("eventClassificationTblRefId");
        expect(filters).toHaveProperty("eventTblRefId");

        expect(filters.organisationLookupId).toBe(organisationLookupId);
        expect(filters.networkLookupId).toBeNull();

        for (const key of [
            "servicePointMeterPhaseTblRefId",
            "categoryTblRefId",
            "priorityTblRefId",
            "eventClassificationTblRefId",
            "eventTblRefId",
        ] as const) {
            expect(filters[key]).toBeNull();
        }
    }

    validateItemsLimit(items: EventReportItem[], limit: number) {
        expect(items.length).toBeLessThanOrEqual(limit);
    }

    validateItemsStructure(items: EventReportItem[]) {
        for (const item of items) {
            expect(typeof item.circle).toBe("string");
            expect(typeof item.eventId).toBe("number");
            expect(typeof item.eventName).toBe("string");
            expect(typeof item.meterCount).toBe("number");
            expect(typeof item.eventCount).toBe("number");
            expect(typeof item.durationHhMm).toBe("string");
            expect(typeof item.slNo).toBe("number");
        }
    }

    validateCircleField(items: EventReportItem[]) {
        for (const item of items) {
            expect(item.circle.trim()).not.toEqual("");
        }
    }

    validateEventIdentity(items: EventReportItem[]) {
        for (const item of items) {
            expect(item.eventId).toBeGreaterThan(0);
            expect(item.eventName.trim()).not.toEqual("");
        }
    }

    validateEventCounts(items: EventReportItem[]) {
        for (const item of items) {
            expect(item.meterCount).toBeGreaterThanOrEqual(0);
            expect(item.eventCount).toBeGreaterThanOrEqual(0);

            if (item.meterCount > 0) {
                expect(item.eventCount).toBeGreaterThanOrEqual(1);
            }

            if (item.eventCount > 0) {
                expect(item.meterCount).toBeGreaterThanOrEqual(1);
            }
        }
    }

    validateDurationFormat(items: EventReportItem[]) {
        for (const item of items) {
            expect(DURATION_HH_MM.test(item.durationHhMm)).toBeTruthy();

            const { hours, minutes } = parseDurationHhMm(item.durationHhMm);
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
        }
    }

    validateDurationConsistency(items: EventReportItem[]) {
        for (const item of items) {
            const { hours, minutes } = parseDurationHhMm(item.durationHhMm);

            if (item.eventCount === 0) {
                expect(hours).toBe(0);
                expect(minutes).toBe(0);
            }
        }
    }

    validateSlNoSequence(items: EventReportItem[]) {
        items.forEach((item, index) => {
            expect(item.slNo).toBe(index + 1);
        });
    }

    validateUniqueSlNo(items: EventReportItem[]) {
        const slNos = items.map((item) => item.slNo);
        expect(new Set(slNos).size).toBe(slNos.length);
    }

    validateUniqueEventId(items: EventReportItem[]) {
        const eventIds = items.map((item) => item.eventId);
        expect(new Set(eventIds).size).toBe(eventIds.length);
    }

    validateUniqueEventName(items: EventReportItem[]) {
        const eventNames = items.map((item) => item.eventName);
        expect(new Set(eventNames).size).toBe(eventNames.length);
    }

    validateNoDataScenario(data: EventReportData) {
        if (data.items.length === 0) {
            expect(data.scopedMeterCount).toBeGreaterThanOrEqual(0);
        }
    }

    validateItemsPresentWhenScoped(data: EventReportData) {
        if (data.scopedMeterCount > 0 && data.items.length > 0) {
            expect(data.items.length).toBeGreaterThan(0);
        }
    }
}
