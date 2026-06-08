import { expect } from "@playwright/test";
import {
    EventLogListData,
    EventLogRow,
} from "../Mapper/eventloglist.mapper";

const ALLOWED_STATUSES = ["Resolved", "Pending"] as const;
const ROW_REQUIRED_FIELDS = [
    "serialNo",
    "meterNo",
    "occurDateTime",
    "restoreDateTime",
    "description",
    "durationDisplay",
    "status",
] as const;
// Backend formatDurationHuman: e.g. "0m 10s", "1m 47s", "2h 5m 30s"
const HUMAN_DURATION =
    /^\d+h(?:\s+\d+m)?(?:\s+\d+s)?$|^\d+m(?:\s+\d+s)?$/;
const IST_DATE_TIME =
    /^\d{1,2}[\s/-](?:\w{3}|\d{2})[\s/-]\d{4}.+\d{1,2}:\d{2}|^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/i;

function parseEventDateTime(value: string): number | null {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export class EventLogListValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: EventLogListData) {
        expect(Array.isArray(data.rows)).toBeTruthy();
        expect(typeof data.page).toBe("number");
        expect(typeof data.pageSize).toBe("number");
        expect(typeof data.totalCount).toBe("number");
        expect(typeof data.totalPages).toBe("number");
    }

    validateQueryEcho(
        data: EventLogListData,
        eventPage: number,
        eventPageSize: number,
    ) {
        expect(data.page).toBe(eventPage);
        expect(data.pageSize).toBe(eventPageSize);
    }

    validatePaginationBounds(data: EventLogListData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.pageSize).toBeGreaterThan(0);
        expect(data.totalCount).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);
    }

    validatePaginationMath(data: EventLogListData) {
        if (data.totalCount === 0) {
            expect(data.rows.length).toBe(0);
            expect(data.totalPages).toBe(0);
            return;
        }

        expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
        const expectedPages = Math.ceil(data.totalCount / data.pageSize);
        expect(data.totalPages).toBe(expectedPages);
    }

    validateEmptyScenario(data: EventLogListData) {
        if (data.totalCount !== 0) {
            return;
        }
        expect(data.rows.length).toBe(0);
        expect(data.totalPages).toBe(0);
    }

    validateRowsPresentWhenTotalPositive(data: EventLogListData) {
        if (data.totalCount > 0) {
            expect(data.rows.length).toBeGreaterThan(0);
            expect(data.totalPages).toBeGreaterThan(0);
        }
    }

    validateDataPresentPagination(data: EventLogListData) {
        if (data.rows.length === 0) {
            return;
        }
        expect(data.totalCount).toBeGreaterThan(0);
        expect(data.totalPages).toBeGreaterThan(0);
    }

    validateRowRequiredFields(rows: EventLogRow[]) {
        rows.forEach((row) => {
            ROW_REQUIRED_FIELDS.forEach((field) => {
                expect(row).toHaveProperty(field);
            });
        });
    }

    validateRowStructure(rows: EventLogRow[]) {
        rows.forEach((row) => {
            expect(typeof row.serialNo).toBe("number");
            expect(row.serialNo).toBeGreaterThan(0);
            expect(
                row.meterNo === null || typeof row.meterNo === "string",
            ).toBeTruthy();
            expect(typeof row.occurDateTime).toBe("string");
            expect(row.occurDateTime.length).toBeGreaterThan(0);
            expect(
                row.restoreDateTime === null ||
                    typeof row.restoreDateTime === "string",
            ).toBeTruthy();
            expect(
                row.description === null || typeof row.description === "string",
            ).toBeTruthy();
            expect(
                row.durationDisplay === null ||
                    typeof row.durationDisplay === "string",
            ).toBeTruthy();
            expect(ALLOWED_STATUSES).toContain(row.status);
        });
    }

    validateSerialSequence(rows: EventLogRow[], page: number, pageSize: number) {
        const base = (page - 1) * pageSize;
        rows.forEach((row, index) => {
            expect(row.serialNo).toBe(base + index + 1);
        });
    }

    validateUniqueSerialNumbers(rows: EventLogRow[]) {
        const serials = rows.map((row) => row.serialNo);
        expect(new Set(serials).size).toBe(serials.length);
    }

    validateStatusRules(rows: EventLogRow[]) {
        rows.forEach((row) => {
            if (row.status === "Resolved") {
                // Backend marks Resolved when durationSeconds != null; restoreDateTime
                // is only computed when durationSeconds > 0 (instant resolution → null).
                expect(
                    row.restoreDateTime === null ||
                        typeof row.restoreDateTime === "string",
                ).toBeTruthy();
                expect(row.durationDisplay).toBeTruthy();
            } else {
                expect(row.status).toBe("Pending");
                expect(row.restoreDateTime).toBeNull();
            }
        });
    }

    validateDateTimeFormat(rows: EventLogRow[]) {
        rows.forEach((row) => {
            expect(row.occurDateTime.trim().length).toBeGreaterThan(0);
            expect(IST_DATE_TIME.test(row.occurDateTime.trim())).toBeTruthy();
            if (row.restoreDateTime) {
                expect(row.restoreDateTime.trim().length).toBeGreaterThan(0);
                expect(IST_DATE_TIME.test(row.restoreDateTime.trim())).toBeTruthy();
            }
        });
    }

    validateDurationDisplayFormat(rows: EventLogRow[]) {
        rows.forEach((row) => {
            if (row.status !== "Resolved" || row.durationDisplay == null) {
                return;
            }
            expect(HUMAN_DURATION.test(row.durationDisplay.trim())).toBeTruthy();
        });
    }

    validateMeterNo(rows: EventLogRow[]) {
        rows.forEach((row) => {
            if (row.meterNo == null) {
                return;
            }
            expect(row.meterNo.trim().length).toBeGreaterThan(0);
        });
    }

    validateMeterNoConsistency(rows: EventLogRow[]) {
        const meterNumbers = rows
            .map((row) => row.meterNo?.trim())
            .filter((value): value is string => Boolean(value));
        if (meterNumbers.length < 2) {
            return;
        }
        expect(new Set(meterNumbers).size).toBe(1);
    }

    validateDescription(rows: EventLogRow[]) {
        rows.forEach((row) => {
            if (row.description == null) {
                return;
            }
            expect(typeof row.description).toBe("string");
        });
    }

    validateRestoreAfterOccurrence(rows: EventLogRow[]) {
        rows.forEach((row) => {
            if (row.status !== "Resolved" || !row.restoreDateTime) {
                return;
            }
            const occurMs = parseEventDateTime(row.occurDateTime);
            const restoreMs = parseEventDateTime(row.restoreDateTime);
            if (occurMs != null && restoreMs != null) {
                expect(restoreMs).toBeGreaterThanOrEqual(occurMs);
            }
        });
    }

    validateChronologicalOrder(rows: EventLogRow[]) {
        if (rows.length < 2) {
            return;
        }
        for (let i = 0; i < rows.length - 1; i++) {
            const current = parseEventDateTime(rows[i].occurDateTime);
            const next = parseEventDateTime(rows[i + 1].occurDateTime);
            if (current != null && next != null) {
                expect(current).toBeGreaterThanOrEqual(next);
            }
        }
    }

    validateStatusDistribution(rows: EventLogRow[]) {
        const statuses = rows.map((row) => row.status);
        statuses.forEach((status) => {
            expect(ALLOWED_STATUSES).toContain(status);
        });
    }

    validateBusinessRules(data: EventLogListData) {
        expect(data).toHaveProperty("rows");
        expect(data).toHaveProperty("page");
        expect(data).toHaveProperty("pageSize");
        expect(data).toHaveProperty("totalCount");
        expect(data).toHaveProperty("totalPages");
    }
}
