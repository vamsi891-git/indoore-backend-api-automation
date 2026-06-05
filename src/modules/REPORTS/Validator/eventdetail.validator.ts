import { expect } from "@playwright/test";
import {
    EventDetailReportData,
    EventDetailResponse,
    EventDetailRow,
} from "../Mapper/eventdetail.mapper";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DURATION_HH_MM = /^\d+:\d{2}$/;
const EVENT_CLASSIFICATION = /^Class_D\d+$/;

function parseIsoDate(value: string): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function parseDurationHhMm(value: string): { hours: number; minutes: number } {
    const [hours, minutes] = value.split(":").map(Number);
    return { hours, minutes };
}

export class EventDetailValidator {
    validateSuccess(response: EventDetailResponse) {
        expect(response.success).toBeTruthy();
    }

    validateRootStructure(response: EventDetailResponse) {
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data.rows)).toBeTruthy();
        expect(response.data.appliedFilters).toBeDefined();
        expect(typeof response.data.previewNote).toBe("string");
    }

    validateQueryEcho(
        data: EventDetailReportData,
        fromDate: string,
        toDate: string,
        limit: number,
    ) {
        expect(data.fromDate).toBe(fromDate);
        expect(data.toDate).toBe(toDate);
        expect(data.limit).toBe(limit);
    }

    validateDateRangeFormat(data: EventDetailReportData) {
        expect(ISO_DATE.test(data.fromDate)).toBeTruthy();
        expect(ISO_DATE.test(data.toDate)).toBeTruthy();
        expect(parseIsoDate(data.fromDate).getTime()).toBeLessThanOrEqual(
            parseIsoDate(data.toDate).getTime(),
        );
    }

    validateScopedMeterCount(data: EventDetailReportData) {
        expect(data.scopedMeterCount).toBeGreaterThanOrEqual(0);
    }

    validateTotalRowCount(data: EventDetailReportData) {
        expect(data.totalRowCount).toBeGreaterThanOrEqual(0);
        expect(data.totalRowCount).toBeGreaterThanOrEqual(data.rows.length);
    }

    validateTruncation(data: EventDetailReportData) {
        expect(typeof data.truncated).toBe("boolean");

        if (data.truncated) {
            expect(data.totalRowCount).toBeGreaterThan(data.rows.length);
        }

        if (data.totalRowCount <= data.limit) {
            expect(data.truncated).toBeFalsy();
        }
    }

    validatePreviewNote(data: EventDetailReportData) {
        if (data.previewNote.length > 0) {
            expect(data.previewNote).toContain("limit");
        }
    }

    validateAppliedFilters(
        data: EventDetailReportData,
        organisationLookupId: number,
    ) {
        const filters = data.appliedFilters;

        expect(filters.organisationLookupId).toBe(organisationLookupId);
        expect(filters.networkLookupId).toBeNull();
        expect(filters.meterSerialNumber).toBeNull();
        expect(filters.ivrsNumber).toBeNull();

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

    validateRowsLimit(rows: EventDetailRow[], limit: number) {
        expect(rows.length).toBeLessThanOrEqual(limit);
    }

    validateRowsStructure(rows: EventDetailRow[]) {
        for (const row of rows) {
            expect(typeof row.slNo).toBe("number");
            expect(typeof row.division).toBe("string");
            expect(typeof row.zone).toBe("string");
            expect(typeof row.feeder).toBe("string");
            expect(typeof row.dtr).toBe("string");
            expect(typeof row.name).toBe("string");
            expect(typeof row.address).toBe("string");
            expect(typeof row.ivrsNumber).toBe("string");
            expect(typeof row.tariff).toBe("string");
            expect(typeof row.msn).toBe("string");
            expect(typeof row.phase).toBe("string");
            expect(typeof row.eventClassificationName).toBe("string");
            expect(typeof row.eventId).toBe("number");
            expect(typeof row.eventName).toBe("string");
            expect(typeof row.eventCount).toBe("number");
            expect(typeof row.durationHhMm).toBe("string");
        }
    }

    validateConsumerFields(rows: EventDetailRow[]) {
        for (const row of rows) {
            expect(row.name.trim()).not.toEqual("");
            expect(row.address.trim()).not.toEqual("");
            expect(row.ivrsNumber.trim()).not.toEqual("");
            expect(row.tariff.trim()).not.toEqual("");
            expect(row.phase.trim()).not.toEqual("");
        }
    }

    validateMeterFields(rows: EventDetailRow[]) {
        for (const row of rows) {
            expect(row.msn.trim()).not.toEqual("");
            expect(row.dtr.trim()).not.toEqual("");
            expect(/^\d+$/.test(row.msn.trim())).toBeTruthy();
        }
    }

    validateHierarchyFields(rows: EventDetailRow[]) {
        for (const row of rows) {
            expect(typeof row.division).toBe("string");
            expect(typeof row.zone).toBe("string");
            expect(typeof row.feeder).toBe("string");
        }
    }

    validateEventFields(rows: EventDetailRow[]) {
        for (const row of rows) {
            expect(row.eventId).toBeGreaterThan(0);
            expect(row.eventName.trim()).not.toEqual("");
            expect(row.eventCount).toBeGreaterThanOrEqual(1);
            expect(EVENT_CLASSIFICATION.test(row.eventClassificationName)).toBeTruthy();
        }
    }

    validateDurationFormat(rows: EventDetailRow[]) {
        for (const row of rows) {
            expect(DURATION_HH_MM.test(row.durationHhMm)).toBeTruthy();

            const { hours, minutes } = parseDurationHhMm(row.durationHhMm);
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
        }
    }

    validateSlNoSequence(rows: EventDetailRow[]) {
        rows.forEach((row, index) => {
            expect(row.slNo).toBe(index + 1);
        });
    }

    validateUniqueSlNo(rows: EventDetailRow[]) {
        const slNos = rows.map((row) => row.slNo);
        expect(new Set(slNos).size).toBe(slNos.length);
    }

    validateUniqueMeterEventCombination(rows: EventDetailRow[]) {
        const keys = rows.map((row) => `${row.msn}_${row.eventId}`);
        expect(new Set(keys).size).toBe(keys.length);
    }

    validateNoDataScenario(data: EventDetailReportData) {
        if (data.rows.length === 0) {
            expect(data.totalRowCount).toBe(0);
            expect(data.truncated).toBeFalsy();
        }
    }

    validateRowsPresentWhenTotalPositive(data: EventDetailReportData) {
        if (data.totalRowCount > 0) {
            expect(data.rows.length).toBeGreaterThan(0);
        }
    }
}
