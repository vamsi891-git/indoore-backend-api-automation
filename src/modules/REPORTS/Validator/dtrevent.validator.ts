import { expect } from "@playwright/test";
import {dtrEventDefaultLimit,dtrEventDefaultPage,dtrEventExpectedColumns,} from "../Data/dtrevent.data";
import type {DtrEventErrorBody,DtrEventResponse,DtrEventRow,DtrEventScenario,MappedDtrEvent,} from "../Mapper/dtrevent.mapper";
import { dtrEventColumnKeys } from "../Mapper/dtrevent.mapper";
const DURATION_HH_MM_SS_OR_NA = /^(\d+:\d{2}:\d{2}|NA)$/;
function parseDurationHhMmSs(value: string): {
    hours: number;
    minutes: number;
    seconds: number;
} {
    const [hours, minutes, seconds] = value.split(":").map(Number);
    return { hours, minutes, seconds };
}
export class DtrEventValidator {
    validateResponseEnvelope(response: DtrEventResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }
    validateValidationError(responseBody: DtrEventErrorBody): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error?.message).toBeTruthy();
    }
    validateSuccess(mapped: MappedDtrEvent): void {
        expect(mapped.success).toBeTruthy();
    }
    validateRootStructure(mapped: MappedDtrEvent): void {
        expect(Array.isArray(mapped.columns)).toBeTruthy();
        expect(Array.isArray(mapped.rows)).toBeTruthy();
        expect(mapped.pagination).toBeDefined();
        expect(typeof mapped.pagination.page).toBe("number");
        expect(typeof mapped.pagination.limit).toBe("number");
        expect(typeof mapped.pagination.total).toBe("number");
        expect(typeof mapped.pagination.totalPages).toBe("number");
    }
    validateColumns(mapped: MappedDtrEvent): void {
        expect(mapped.columns.length).toBe(dtrEventExpectedColumns.length);
        mapped.columns.forEach((column, index) => {
            expect(column.key).toBe(dtrEventExpectedColumns[index]?.key);
            expect(column.header).toBe(
                dtrEventExpectedColumns[index]?.header,
            );
            expect(dtrEventColumnKeys).toContain(column.key);
        });
    }
    validatePaginationEcho(mapped: MappedDtrEvent,page: number,limit: number,): void {
        expect(mapped.pagination.page).toBe(page);
        expect(mapped.pagination.limit).toBe(limit);
    }
    validatePaginationBounds(mapped: MappedDtrEvent): void {
        expect(mapped.pagination.page).toBeGreaterThan(0);
        expect(mapped.pagination.limit).toBeGreaterThan(0);
        expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
        expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
        expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
    }
    validatePaginationMath(mapped: MappedDtrEvent): void {
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
    validateRowsLimit(mapped: MappedDtrEvent): void {
        expect(mapped.rows.length).toBeLessThanOrEqual(
            mapped.pagination.limit,
        );
    }
    validateNoDataScenario(mapped: MappedDtrEvent): void {
        if (mapped.pagination.total === 0) {
            expect(mapped.rows.length).toBe(0);
        }
    }
    validatePageBeyondTotal(mapped: MappedDtrEvent,requestedPage: number,): void {
        if (
            mapped.pagination.totalPages > 0 &&
            requestedPage > mapped.pagination.totalPages
        ) {
            expect(mapped.rows.length).toBe(0);
        }
    }
    validateRowsStructure(rows: DtrEventRow[]): void {
        for (const row of rows) {
            expect(typeof row.id).toBe("string");
            expect(row.id.trim().length).toBeGreaterThan(0);
            expect(typeof row.slNo).toBe("number");
            expect(typeof row.circle).toBe("string");
            expect(typeof row.division).toBe("string");
            expect(typeof row.zone).toBe("string");
            expect(typeof row.subStation).toBe("string");
            expect(typeof row.feeder).toBe("string");
            expect(typeof row.dt).toBe("string");
            expect(typeof row.dtrMeterNo).toBe("string");
            expect(
                typeof row.dtrRatingKva === "number" ||
                    typeof row.dtrRatingKva === "string",
            ).toBeTruthy();
            expect(typeof row.eventCount).toBe("number");
            expect(typeof row.durationHhMmSs).toBe("string");
        }
    }
    validateDtrIdentity(rows: DtrEventRow[]): void {
        for (const row of rows) {
            expect(row.dt.trim().length).toBeGreaterThan(0);
        }
    }
    validateEventMetrics(rows: DtrEventRow[]): void {
        for (const row of rows) {
            expect(row.eventCount).toBeGreaterThanOrEqual(0);
            if (row.eventCount > 0) {
                expect(row.durationHhMmSs).not.toBe("");
            }
        }
    }
    validateDurationFormat(rows: DtrEventRow[]): void {
        for (const row of rows) {
            expect(DURATION_HH_MM_SS_OR_NA.test(row.durationHhMmSs)).toBeTruthy();
            if (row.durationHhMmSs === "NA") {
                continue;
            }
            const { hours, minutes, seconds } = parseDurationHhMmSs(
                row.durationHhMmSs,
            );
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
            expect(seconds).toBeGreaterThanOrEqual(0);
            expect(seconds).toBeLessThan(60);
        }
    }
    validateMeterNumber(rows: DtrEventRow[]): void {
        for (const row of rows) {
            if (row.dtrMeterNo.trim().length === 0) {
                continue;
            }
            expect(/^\d+$/.test(row.dtrMeterNo.trim())).toBeTruthy();
        }
    }
    validateSlNoSequence(rows: DtrEventRow[],page: number,limit: number,): void {
        const base = (page - 1) * limit;
        rows.forEach((row, index) => {
            expect(row.slNo).toBe(base + index + 1);
        });
    }
    validateUniqueSlNo(rows: DtrEventRow[]): void {
        const slNos = rows.map((row) => row.slNo);
        expect(new Set(slNos).size).toBe(slNos.length);
    }
    validateUniqueDtrIds(rows: DtrEventRow[]): void {
        const ids = rows.map((row) => row.id);
        expect(new Set(ids).size).toBe(ids.length);
    }
    validateLiveOk(mapped: MappedDtrEvent,page = dtrEventDefaultPage,limit = dtrEventDefaultLimit,): void {
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
            this.validateDtrIdentity(mapped.rows);
            this.validateEventMetrics(mapped.rows);
            this.validateDurationFormat(mapped.rows);
            this.validateMeterNumber(mapped.rows);
            this.validateSlNoSequence(mapped.rows, page, limit);
            this.validateUniqueSlNo(mapped.rows);
            this.validateUniqueDtrIds(mapped.rows);
        }
    }
    validateLiveEmptyRowsContract(mapped: MappedDtrEvent): void {
        this.validateLiveOk(mapped);
        expect(mapped.pagination.total).toBe(5281);
        expect(mapped.pagination.totalPages).toBe(529);
        expect(mapped.rows.length).toBe(0);
    }
    validateEmptyPageContract(mapped: MappedDtrEvent): void {
        this.validateLiveOk(mapped);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }
    validateSampleRowContract(mapped: MappedDtrEvent): void {
        this.validateLiveOk(mapped);
        expect(mapped.rows.length).toBe(1);
        expect(mapped.rows[0]?.id).toBe("dtr-482910");
        expect(mapped.rows[0]?.dt).toBe("RU727");
        expect(mapped.rows[0]?.eventCount).toBe(12);
        expect(mapped.rows[0]?.durationHhMmSs).toBe("0:32:15");
    }
    validatePageBeyondLive(mapped: MappedDtrEvent,requestedPage: number,): void {
        this.validateSuccess(mapped);
        this.validateRootStructure(mapped);
        this.validateColumns(mapped);
        this.validatePaginationBounds(mapped);
        this.validatePaginationMath(mapped);
        this.validatePageBeyondTotal(mapped, requestedPage);
    }
    validateScenario(mapped: MappedDtrEvent,scenario: DtrEventScenario,page = dtrEventDefaultPage,limit = dtrEventDefaultLimit,): void {
        switch (scenario) {
            case "contract_live_empty_rows":
                this.validateLiveEmptyRowsContract(mapped);
                break;
            case "contract_empty_page":
                this.validateEmptyPageContract(mapped);
                break;
            case "contract_sample_row":
                this.validateSampleRowContract(mapped);
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
