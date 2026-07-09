import { expect } from "@playwright/test";
import {
    dtrEventsAllowedStatuses,
    dtrEventsDataFields,
    dtrEventsRowFields,
} from "../Data/dtrevents.data";
import type {
    DtrEventRow,
    DtrEventsData,
    DtrEventsErrorResponse,
    DtrEventsResponse,
    DtrEventsScenario,
    MappedDtrEvents,
} from "../Mapper/dtrevents.mapper";

const ALLOWED_STATUSES = dtrEventsAllowedStatuses;

// Backend formatDurationHuman: e.g. "0m 10s", "1m 47s", "2h 5m 30s"
const HUMAN_DURATION =
    /^\d+h(?:\s+\d+m)?(?:\s+\d+s)?$|^\d+m(?:\s+\d+s)?$/;
const IST_DATE_TIME =
    /^\d{1,2}[\s/-](?:\w{3}|\d{2})[\s/-]\d{4}.+\d{1,2}:\d{2}|^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/i;

function parseEventDateTime(value: string): number | null {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export class DtrEventsValidator {
    validateNotFoundError(responseBody: DtrEventsErrorResponse): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
        expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
    }

    validateBlankCodeError(responseBody: DtrEventsErrorResponse): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(
            /dtr|network|code/i,
        );
    }

    validateInvalidPageError(responseBody: DtrEventsErrorResponse): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(/page/i);
    }

    // =====================================
    // RESPONSE ENVELOPE
    // =====================================
    validateResponseEnvelope(response: DtrEventsResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    // =====================================
    // ROOT STRUCTURE
    // =====================================
    validateRootStructure(data: DtrEventsData): void {
        expect(Array.isArray(data.rows)).toBeTruthy();
        expect(typeof data.page).toBe("number");
        expect(typeof data.pageSize).toBe("number");
        expect(typeof data.totalCount).toBe("number");
        expect(typeof data.totalPages).toBe("number");
    }

    // =====================================
    // QUERY ECHO — page + pageSize (limit)
    // =====================================
    validateQueryEcho(data: DtrEventsData, page: number, limit: number): void {
        expect(data.page).toBe(page);
        expect(data.pageSize).toBe(limit);
    }

    // =====================================
    // PAGINATION BOUNDS
    // =====================================
    validatePaginationBounds(data: DtrEventsData): void {
        expect(data.page).toBeGreaterThan(0);
        expect(data.pageSize).toBeGreaterThan(0);
        expect(data.totalCount).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);
    }

    // =====================================
    // PAGINATION MATH — totalPages = ceil(totalCount / pageSize)
    // =====================================
    validatePaginationMath(data: DtrEventsData): void {
        if (data.totalCount === 0) {
            expect(data.rows.length).toBe(0);
            expect(data.totalPages).toBe(0);
            return;
        }

        expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
        expect(data.totalPages).toBe(Math.ceil(data.totalCount / data.pageSize));
    }

    // =====================================
    // APPROXIMATE TOTAL — full page → totalCount >= offset + pageSize
    // =====================================
    validateApproximateTotalCount(data: DtrEventsData): void {
        if (data.rows.length === data.pageSize) {
            const offset = (data.page - 1) * data.pageSize;
            expect(data.totalCount).toBeGreaterThanOrEqual(offset + data.pageSize);
        }
    }

    // =====================================
    // EMPTY SCENARIO — no meter / no archive events
    // =====================================
    validateEmptyScenario(data: DtrEventsData): void {
        if (data.totalCount !== 0) {
            return;
        }
        expect(data.rows).toEqual([]);
        expect(data.totalPages).toBe(0);
    }

    validateRowsPresentWhenTotalPositive(data: DtrEventsData): void {
        if (data.totalCount === 0) {
            return;
        }

        const offset = (data.page - 1) * data.pageSize;
        if (data.totalCount <= offset) {
            expect(data.rows.length).toBe(0);
            return;
        }

        expect(data.rows.length).toBeGreaterThan(0);
        expect(data.totalPages).toBeGreaterThan(0);
    }

    validateDataPresentPagination(data: DtrEventsData): void {
        if (data.rows.length === 0) {
            return;
        }
        expect(data.totalCount).toBeGreaterThan(0);
        expect(data.totalPages).toBeGreaterThan(0);
    }

    // =====================================
    // ROW FIELDS — getDtrEventLogByCode mapping
    // =====================================
    validateRowRequiredFields(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            for (const field of dtrEventsRowFields) {
                expect(row).toHaveProperty(field);
            }
            expect(Object.keys(row).sort()).toEqual(
                [...dtrEventsRowFields].sort(),
            );
        });
    }

    validateRowStructure(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            expect(typeof row.serialNo).toBe("number");
            expect(row.serialNo).toBeGreaterThan(0);
            expect(
                row.meterSlNo === null || typeof row.meterSlNo === "string",
            ).toBeTruthy();
            expect(typeof row.eventDateTime).toBe("string");
            expect(row.eventDateTime.length).toBeGreaterThan(0);
            expect(
                row.restoredDateTime === null ||
                    typeof row.restoredDateTime === "string",
            ).toBeTruthy();
            expect(
                row.description === null || typeof row.description === "string",
            ).toBeTruthy();
            expect(
                row.duration === null || typeof row.duration === "string",
            ).toBeTruthy();
            expect([...ALLOWED_STATUSES]).toContain(row.status);
        });
    }

    // serialNo = offset + idx + 1
    validateSerialSequence(rows: DtrEventRow[], page: number, pageSize: number): void {
        const base = (page - 1) * pageSize;
        rows.forEach((row, index) => {
            expect(row.serialNo).toBe(base + index + 1);
        });
    }

    validateUniqueSerialNumbers(rows: DtrEventRow[]): void {
        const serials = rows.map((row) => row.serialNo);
        expect(new Set(serials).size).toBe(serials.length);
    }

    // durationSeconds != null → Resolved; else Pending
    validateStatusRules(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            if (row.status === "Resolved") {
                expect(
                    row.restoredDateTime === null ||
                        typeof row.restoredDateTime === "string",
                ).toBeTruthy();
                expect(row.duration).toBeTruthy();
            } else {
                expect(row.status).toBe("Pending");
                expect(row.restoredDateTime).toBeNull();
            }
        });
    }

    validateDateTimeFormat(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            expect(row.eventDateTime.trim().length).toBeGreaterThan(0);
            expect(IST_DATE_TIME.test(row.eventDateTime.trim())).toBeTruthy();
            if (row.restoredDateTime) {
                expect(row.restoredDateTime.trim().length).toBeGreaterThan(0);
                expect(
                    IST_DATE_TIME.test(row.restoredDateTime.trim()),
                ).toBeTruthy();
            }
        });
    }

    validateDurationFormat(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            if (row.status !== "Resolved" || row.duration == null) {
                return;
            }
            expect(HUMAN_DURATION.test(row.duration.trim())).toBeTruthy();
        });
    }

    validateMeterSlNo(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            if (row.meterSlNo == null) {
                return;
            }
            expect(row.meterSlNo.trim().length).toBeGreaterThan(0);
        });
    }

    // Same DTR asset meter on all rows
    validateMeterSlNoConsistency(rows: DtrEventRow[]): void {
        const meterSerials = rows
            .map((row) => row.meterSlNo?.trim())
            .filter((value): value is string => Boolean(value));
        if (meterSerials.length < 2) {
            return;
        }
        expect(new Set(meterSerials).size).toBe(1);
    }

    validateDescription(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            if (row.description == null) {
                return;
            }
            expect(typeof row.description).toBe("string");
        });
    }

    // restoreTime = occurrence + durationSeconds when duration > 0
    validateRestoreAfterOccurrence(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            if (row.status !== "Resolved" || !row.restoredDateTime) {
                return;
            }
            const eventMs = parseEventDateTime(row.eventDateTime);
            const restoreMs = parseEventDateTime(row.restoredDateTime);
            if (eventMs != null && restoreMs != null) {
                expect(restoreMs).toBeGreaterThanOrEqual(eventMs);
            }
        });
    }

    // ORDER BY Occurence_Time DESC
    validateChronologicalOrder(rows: DtrEventRow[]): void {
        if (rows.length < 2) {
            return;
        }
        for (let i = 0; i < rows.length - 1; i++) {
            const current = parseEventDateTime(rows[i].eventDateTime);
            const next = parseEventDateTime(rows[i + 1].eventDateTime);
            if (current != null && next != null) {
                expect(current).toBeGreaterThanOrEqual(next);
            }
        }
    }

    validateStatusDistribution(rows: DtrEventRow[]): void {
        rows.forEach((row) => {
            expect([...ALLOWED_STATUSES]).toContain(row.status);
        });
    }

    validateDataFields(data: DtrEventsData): void {
        for (const field of dtrEventsDataFields) {
            expect(data).toHaveProperty(field);
        }
    }

    validateLiveOk(
        mapped: MappedDtrEvents,
        page: number,
        limit: number,
    ): void {
        this.validateSuccess(mapped.success);
        this.validateRootStructure(mapped);
        this.validateDataFields(mapped);
        this.validateQueryEcho(mapped, page, limit);
        this.validatePaginationBounds(mapped);
        this.validatePaginationMath(mapped);
        this.validateApproximateTotalCount(mapped);
        this.validateEmptyScenario(mapped);
        this.validateRowsPresentWhenTotalPositive(mapped);

        const { rows } = mapped;
        if (rows.length > 0) {
            this.validateDataPresentPagination(mapped);
            this.validateRowRequiredFields(rows);
            this.validateRowStructure(rows);
            this.validateSerialSequence(rows, mapped.page, mapped.pageSize);
            this.validateUniqueSerialNumbers(rows);
            this.validateStatusRules(rows);
            this.validateStatusDistribution(rows);
            this.validateMeterSlNo(rows);
            this.validateMeterSlNoConsistency(rows);
            this.validateDescription(rows);
            this.validateDateTimeFormat(rows);
            this.validateDurationFormat(rows);
            this.validateRestoreAfterOccurrence(rows);
            this.validateChronologicalOrder(rows);
        }
    }

    validateEmptyPageContract(mapped: MappedDtrEvents): void {
        this.validateSuccess(mapped.success);
        this.validateRootStructure(mapped);
        expect(mapped.rows).toEqual([]);
        expect(mapped.page).toBe(1);
        expect(mapped.pageSize).toBe(20);
        expect(mapped.totalCount).toBe(0);
        expect(mapped.totalPages).toBe(0);
    }

    validateResolvedRowContract(mapped: MappedDtrEvents): void {
        this.validateLiveOk(mapped, 1, 20);
        expect(mapped.rows.length).toBe(1);
        expect(mapped.rows[0].status).toBe("Resolved");
        expect(mapped.rows[0].duration).toBe("5m 10s");
        expect(mapped.rows[0].restoredDateTime).toBe("09-07-2026 14:35:25");
    }

    validatePendingRowContract(mapped: MappedDtrEvents): void {
        this.validateLiveOk(mapped, 1, 20);
        expect(mapped.rows.length).toBe(1);
        expect(mapped.rows[0].status).toBe("Pending");
        expect(mapped.rows[0].restoredDateTime).toBeNull();
        expect(mapped.rows[0].duration).toBeNull();
    }

    validatePageTwoContract(mapped: MappedDtrEvents): void {
        this.validateLiveOk(mapped, 2, 20);
        expect(mapped.page).toBe(2);
        expect(mapped.rows[0].serialNo).toBe(21);
        expect(mapped.totalCount).toBe(25);
        expect(mapped.totalPages).toBe(2);
    }

    validateScenario(
        mapped: MappedDtrEvents,
        scenario: DtrEventsScenario,
        page: number,
        limit: number,
    ): void {
        switch (scenario) {
            case "contract_empty_page":
                this.validateEmptyPageContract(mapped);
                break;
            case "contract_resolved_row":
                this.validateResolvedRowContract(mapped);
                break;
            case "contract_pending_row":
                this.validatePendingRowContract(mapped);
                break;
            case "contract_pagination_page_two":
                this.validatePageTwoContract(mapped);
                break;
            case "dev_by_code_primary":
            case "dev_by_code_alt":
            case "dev_page_two":
            case "dev_custom_limit":
            case "dev_ignore_unknown_query":
            case "dev_with_search_query":
                this.validateLiveOk(mapped, page, limit);
                break;
            default:
                break;
        }
    }
}
