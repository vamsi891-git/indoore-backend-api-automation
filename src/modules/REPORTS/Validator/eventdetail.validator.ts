import { expect } from "@playwright/test";
import {
    eventDetailDefaultLimit,
    eventDetailDefaultPage,
    eventDetailExpectedColumns,
} from "../Data/eventdetail.data";
import type {
    EventDetailErrorBody,
    EventDetailResponse,
    EventDetailRow,
    EventDetailScenario,
    MappedEventDetail,
} from "../Mapper/eventdetail.mapper";
import { eventDetailColumnKeys } from "../Mapper/eventdetail.mapper";

const DURATION_HH_MM_OR_NA = /^(\d+:\d{2}|NA)$/;
const EVENT_CLASSIFICATION = /^Class_D\d+$/;

function parseDurationHhMm(value: string): { hours: number; minutes: number } {
    const [hours, minutes] = value.split(":").map(Number);
    return { hours, minutes };
}

export class EventDetailValidator {
    validateResponseEnvelope(response: EventDetailResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateValidationError(responseBody: EventDetailErrorBody): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error?.message).toBeTruthy();
    }

    validateSuccess(mapped: MappedEventDetail): void {
        expect(mapped.success).toBeTruthy();
    }

    validateRootStructure(mapped: MappedEventDetail): void {
        expect(Array.isArray(mapped.columns)).toBeTruthy();
        expect(Array.isArray(mapped.rows)).toBeTruthy();
        expect(mapped.pagination).toBeDefined();
        expect(typeof mapped.pagination.page).toBe("number");
        expect(typeof mapped.pagination.limit).toBe("number");
        expect(typeof mapped.pagination.total).toBe("number");
        expect(typeof mapped.pagination.totalPages).toBe("number");
    }

    validateColumns(mapped: MappedEventDetail): void {
        expect(mapped.columns.length).toBe(eventDetailExpectedColumns.length);
        mapped.columns.forEach((column, index) => {
            expect(column.key).toBe(eventDetailExpectedColumns[index]?.key);
            expect(column.header).toBe(
                eventDetailExpectedColumns[index]?.header,
            );
            expect(eventDetailColumnKeys).toContain(column.key);
        });
    }

    validatePaginationEcho(
        mapped: MappedEventDetail,
        page: number,
        limit: number,
    ): void {
        expect(mapped.pagination.page).toBe(page);
        expect(mapped.pagination.limit).toBe(limit);
    }

    validatePaginationBounds(mapped: MappedEventDetail): void {
        expect(mapped.pagination.page).toBeGreaterThan(0);
        expect(mapped.pagination.limit).toBeGreaterThan(0);
        expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
        expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
        expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
    }

    validatePaginationMath(mapped: MappedEventDetail): void {
        const { total, limit, totalPages } = mapped.pagination;
        const { rows } = mapped;
        if (total === 0) {
            expect(rows.length).toBe(0);
            expect(totalPages).toBe(0);
            return;
        }
        expect(totalPages).toBe(Math.ceil(total / limit));
        expect(total).toBeGreaterThanOrEqual(rows.length);
    }

    validateRowsLimit(mapped: MappedEventDetail): void {
        expect(mapped.rows.length).toBeLessThanOrEqual(
            mapped.pagination.limit,
        );
    }

    validateRowsStructure(rows: EventDetailRow[]): void {
        for (const row of rows) {
            expect(typeof row.id).toBe("string");
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

    validateRowIds(rows: EventDetailRow[]): void {
        for (const row of rows) {
            expect(row.id).toBe(`meter-${row.msn}`);
        }
    }

    validateMeterFields(rows: EventDetailRow[]): void {
        for (const row of rows) {
            expect(row.msn.trim().length).toBeGreaterThan(0);
            expect(/^\d+$/.test(row.msn.trim())).toBeTruthy();
            expect(row.phase.trim().length).toBeGreaterThan(0);
        }
    }

    validateConsumerFieldsWhenPresent(rows: EventDetailRow[]): void {
        for (const row of rows) {
            if (row.name.trim().length === 0) {
                continue;
            }
            expect(row.address.trim().length).toBeGreaterThan(0);
            expect(row.ivrsNumber.trim().length).toBeGreaterThan(0);
            expect(row.tariff.trim().length).toBeGreaterThan(0);
        }
    }

    validateHierarchyFields(rows: EventDetailRow[]): void {
        for (const row of rows) {
            expect(typeof row.division).toBe("string");
            expect(typeof row.zone).toBe("string");
            expect(typeof row.feeder).toBe("string");
            expect(typeof row.dtr).toBe("string");
        }
    }

    validateEventFields(rows: EventDetailRow[]): void {
        for (const row of rows) {
            expect(row.eventId).toBeGreaterThan(0);
            expect(row.eventName.trim().length).toBeGreaterThan(0);
            expect(row.eventCount).toBeGreaterThanOrEqual(1);
            expect(
                EVENT_CLASSIFICATION.test(row.eventClassificationName),
            ).toBeTruthy();
        }
    }

    validateDurationFormat(rows: EventDetailRow[]): void {
        for (const row of rows) {
            expect(DURATION_HH_MM_OR_NA.test(row.durationHhMm)).toBeTruthy();
            if (row.durationHhMm === "NA") {
                continue;
            }
            const { hours, minutes } = parseDurationHhMm(row.durationHhMm);
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
        }
    }

    validateSlNoSequence(
        rows: EventDetailRow[],
        page: number,
        limit: number,
    ): void {
        const base = (page - 1) * limit;
        rows.forEach((row, index) => {
            expect(row.slNo).toBe(base + index + 1);
        });
    }

    validateUniqueSlNo(rows: EventDetailRow[]): void {
        const slNos = rows.map((row) => row.slNo);
        expect(new Set(slNos).size).toBe(slNos.length);
    }

    validateUniqueMeterEventCombination(rows: EventDetailRow[]): void {
        const keys = rows.map((row) => `${row.msn}_${row.eventId}`);
        expect(new Set(keys).size).toBe(keys.length);
    }

    validateNoDataScenario(mapped: MappedEventDetail): void {
        if (mapped.pagination.total === 0) {
            expect(mapped.rows.length).toBe(0);
        }
    }

    validatePageBeyondTotal(
        mapped: MappedEventDetail,
        requestedPage: number,
    ): void {
        if (
            mapped.pagination.totalPages > 0 &&
            requestedPage > mapped.pagination.totalPages
        ) {
            expect(mapped.rows.length).toBe(0);
        }
    }

    validateLiveOk(
        mapped: MappedEventDetail,
        page = eventDetailDefaultPage,
        limit = eventDetailDefaultLimit,
    ): void {
        this.validateSuccess(mapped);
        this.validateRootStructure(mapped);
        this.validateColumns(mapped);
        this.validatePaginationEcho(mapped, page, limit);
        this.validatePaginationBounds(mapped);
        this.validatePaginationMath(mapped);
        this.validateRowsLimit(mapped);
        this.validateNoDataScenario(mapped);

        if (mapped.rows.length > 0) {
            this.validateRowsStructure(mapped.rows);
            this.validateRowIds(mapped.rows);
            this.validateMeterFields(mapped.rows);
            this.validateConsumerFieldsWhenPresent(mapped.rows);
            this.validateHierarchyFields(mapped.rows);
            this.validateEventFields(mapped.rows);
            this.validateDurationFormat(mapped.rows);
            this.validateSlNoSequence(mapped.rows, page, limit);
            this.validateUniqueSlNo(mapped.rows);
            this.validateUniqueMeterEventCombination(mapped.rows);
        }
    }

    validateLiveFullContract(mapped: MappedEventDetail): void {
        this.validateLiveOk(mapped);
        expect(mapped.pagination.total).toBe(2825);
        expect(mapped.pagination.totalPages).toBe(283);
        expect(mapped.rows.length).toBe(10);
        expect(mapped.rows[0]?.eventId).toBe(529);
        expect(mapped.rows[0]?.eventName).toBe("Power failure");
        expect(mapped.rows[5]?.msn).toBe("19280060");
        expect(mapped.rows[5]?.name).toBe("");
        expect(mapped.rows[9]?.durationHhMm).toBe("NA");
    }

    validateEmptyPageContract(mapped: MappedEventDetail): void {
        this.validateLiveOk(mapped);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validatePageBeyondLive(
        mapped: MappedEventDetail,
        requestedPage: number,
    ): void {
        this.validateSuccess(mapped);
        this.validateRootStructure(mapped);
        this.validateColumns(mapped);
        this.validatePaginationBounds(mapped);
        this.validatePaginationMath(mapped);
        this.validatePageBeyondTotal(mapped, requestedPage);
    }

    validateScenario(
        mapped: MappedEventDetail,
        scenario: EventDetailScenario,
        page = eventDetailDefaultPage,
        limit = eventDetailDefaultLimit,
    ): void {
        switch (scenario) {
            case "contract_live_full":
                this.validateLiveFullContract(mapped);
                break;
            case "contract_empty_page":
                this.validateEmptyPageContract(mapped);
                break;
            case "dev_live_page_beyond":
                this.validatePageBeyondLive(mapped, page);
                break;
            case "dev_live_primary":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, page, limit);
                break;
            default:
                break;
        }
    }
}
