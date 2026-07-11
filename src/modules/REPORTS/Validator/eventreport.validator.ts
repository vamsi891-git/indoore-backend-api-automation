import { expect } from "@playwright/test";
import {
    eventReportExpectedColumns,
    eventReportDefaultLimit,
    eventReportDefaultPage,
} from "../Data/eventreport.data";
import type {
    EventReportErrorBody,
    EventReportResponse,
    EventReportRow,
    EventReportScenario,
    MappedEventReport,
} from "../Mapper/eventreport.mapper";
import { eventReportColumnKeys } from "../Mapper/eventreport.mapper";

const DURATION_HH_MM = /^\d+:\d{2}$/;

function parseDurationHhMm(value: string): { hours: number; minutes: number } {
    const [hours, minutes] = value.split(":").map(Number);
    return { hours, minutes };
}

export class EventReportValidator {
    validateResponseEnvelope(response: EventReportResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateValidationError(responseBody: EventReportErrorBody): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error?.message).toBeTruthy();
    }

    validateSuccess(mapped: MappedEventReport): void {
        expect(mapped.success).toBeTruthy();
    }

    validateRootStructure(mapped: MappedEventReport): void {
        expect(Array.isArray(mapped.columns)).toBeTruthy();
        expect(Array.isArray(mapped.rows)).toBeTruthy();
        expect(mapped.pagination).toBeDefined();
        expect(typeof mapped.pagination.page).toBe("number");
        expect(typeof mapped.pagination.limit).toBe("number");
        expect(typeof mapped.pagination.total).toBe("number");
        expect(typeof mapped.pagination.totalPages).toBe("number");
    }

    validateColumns(mapped: MappedEventReport): void {
        expect(mapped.columns.length).toBe(eventReportExpectedColumns.length);
        mapped.columns.forEach((column, index) => {
            expect(column.key).toBe(eventReportExpectedColumns[index]?.key);
            expect(column.header).toBe(eventReportExpectedColumns[index]?.header);
            expect(eventReportColumnKeys).toContain(column.key);
        });
    }

    validatePaginationEcho(
        mapped: MappedEventReport,
        page: number,
        limit: number,
    ): void {
        expect(mapped.pagination.page).toBe(page);
        expect(mapped.pagination.limit).toBe(limit);
    }

    validatePaginationBounds(mapped: MappedEventReport): void {
        expect(mapped.pagination.page).toBeGreaterThan(0);
        expect(mapped.pagination.limit).toBeGreaterThan(0);
        expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
        expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
        expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
    }

    validatePaginationMath(mapped: MappedEventReport): void {
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

    validateRowsLimit(mapped: MappedEventReport): void {
        expect(mapped.rows.length).toBeLessThanOrEqual(
            mapped.pagination.limit,
        );
    }

    validateRowsStructure(rows: EventReportRow[]): void {
        for (const row of rows) {
            expect(typeof row.id).toBe("string");
            expect(typeof row.circle).toBe("string");
            expect(typeof row.eventId).toBe("number");
            expect(typeof row.eventName).toBe("string");
            expect(typeof row.meterCount).toBe("number");
            expect(typeof row.eventCount).toBe("number");
            expect(typeof row.durationHhMm).toBe("string");
            expect(typeof row.slNo).toBe("number");
        }
    }

    validateRowIds(rows: EventReportRow[]): void {
        for (const row of rows) {
            expect(row.id).toBe(`row-${row.slNo}`);
        }
    }

    validateCircleField(rows: EventReportRow[]): void {
        for (const row of rows) {
            expect(row.circle.trim().length).toBeGreaterThan(0);
        }
    }

    validateEventIdentity(rows: EventReportRow[]): void {
        for (const row of rows) {
            expect(row.eventId).toBeGreaterThan(0);
            expect(row.eventName.trim().length).toBeGreaterThan(0);
        }
    }

    validateEventCounts(rows: EventReportRow[]): void {
        for (const row of rows) {
            expect(row.meterCount).toBeGreaterThanOrEqual(0);
            expect(row.eventCount).toBeGreaterThanOrEqual(0);
            if (row.meterCount > 0) {
                expect(row.eventCount).toBeGreaterThanOrEqual(1);
            }
            if (row.eventCount > 0) {
                expect(row.meterCount).toBeGreaterThanOrEqual(1);
            }
        }
    }

    validateDurationFormat(rows: EventReportRow[]): void {
        for (const row of rows) {
            expect(DURATION_HH_MM.test(row.durationHhMm)).toBeTruthy();
            const { hours, minutes } = parseDurationHhMm(row.durationHhMm);
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
        }
    }

    validateDurationConsistency(rows: EventReportRow[]): void {
        for (const row of rows) {
            const { hours, minutes } = parseDurationHhMm(row.durationHhMm);
            if (row.eventCount === 0) {
                expect(hours).toBe(0);
                expect(minutes).toBe(0);
            }
        }
    }

    validateSlNoSequence(rows: EventReportRow[], page: number, limit: number): void {
        const base = (page - 1) * limit;
        rows.forEach((row, index) => {
            expect(row.slNo).toBe(base + index + 1);
        });
    }

    validateUniqueSlNo(rows: EventReportRow[]): void {
        const slNos = rows.map((row) => row.slNo);
        expect(new Set(slNos).size).toBe(slNos.length);
    }

    validateUniqueEventId(rows: EventReportRow[]): void {
        const eventIds = rows.map((row) => row.eventId);
        expect(new Set(eventIds).size).toBe(eventIds.length);
    }

    validateUniqueEventName(rows: EventReportRow[]): void {
        const eventNames = rows.map((row) => row.eventName);
        expect(new Set(eventNames).size).toBe(eventNames.length);
    }

    validateNoDataScenario(mapped: MappedEventReport): void {
        if (mapped.pagination.total === 0) {
            expect(mapped.rows.length).toBe(0);
        }
    }

    validatePageBeyondTotal(
        mapped: MappedEventReport,
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
        mapped: MappedEventReport,
        page = eventReportDefaultPage,
        limit = eventReportDefaultLimit,
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
            this.validateCircleField(mapped.rows);
            this.validateEventIdentity(mapped.rows);
            this.validateEventCounts(mapped.rows);
            this.validateDurationFormat(mapped.rows);
            this.validateDurationConsistency(mapped.rows);
            this.validateSlNoSequence(mapped.rows, page, limit);
            this.validateUniqueSlNo(mapped.rows);
            this.validateUniqueEventId(mapped.rows);
            this.validateUniqueEventName(mapped.rows);
        }
    }

    validateLiveFullContract(mapped: MappedEventReport): void {
        this.validateLiveOk(mapped);
        expect(mapped.pagination.total).toBe(10);
        expect(mapped.rows.length).toBe(10);
        expect(mapped.rows[0]?.eventId).toBe(547);
        expect(mapped.rows[9]?.eventName).toBe("Over Voltage in any phase");
    }

    validateEmptyPageContract(mapped: MappedEventReport): void {
        this.validateLiveOk(mapped);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validatePage2Live(mapped: MappedEventReport, requestedPage: number): void {
        this.validateSuccess(mapped);
        this.validateRootStructure(mapped);
        this.validateColumns(mapped);
        this.validatePaginationBounds(mapped);
        this.validatePaginationMath(mapped);
        this.validatePageBeyondTotal(mapped, requestedPage);
    }

    validateScenario(
        mapped: MappedEventReport,
        scenario: EventReportScenario,
        page = eventReportDefaultPage,
        limit = eventReportDefaultLimit,
    ): void {
        switch (scenario) {
            case "contract_live_full":
                this.validateLiveFullContract(mapped);
                break;
            case "contract_empty_page":
                this.validateEmptyPageContract(mapped);
                break;
            case "dev_live_page2":
                this.validatePage2Live(mapped, page);
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
