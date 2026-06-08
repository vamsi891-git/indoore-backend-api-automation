import { expect } from "@playwright/test";
import { DtrEventRow, DtrEventsData } from "../Mapper/dtrevents.mapper";

const ALLOWED_STATUSES = ["Resolved", "Pending"] as const;
const ROW_REQUIRED_FIELDS = [
    "serialNo",
    "meterSlNo",
    "eventDateTime",
    "restoredDateTime",
    "description",
    "duration",
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

export class DtrEventsValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: DtrEventsData) {
        expect(Array.isArray(data.rows)).toBeTruthy();
        expect(typeof data.page).toBe("number");
        expect(typeof data.pageSize).toBe("number");
        expect(typeof data.totalCount).toBe("number");
        expect(typeof data.totalPages).toBe("number");
    }

    validateQueryEcho(data: DtrEventsData, page: number, limit: number) {
        expect(data.page).toBe(page);
        expect(data.pageSize).toBe(limit);
    }

    validatePaginationBounds(data: DtrEventsData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.pageSize).toBeGreaterThan(0);
        expect(data.totalCount).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);
    }

    validatePaginationMath(data: DtrEventsData) {
        if (data.totalCount === 0) {
            expect(data.rows.length).toBe(0);
            expect(data.totalPages).toBe(0);
            return;
        }

        expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
        const expectedPages = Math.ceil(data.totalCount / data.pageSize);
        expect(data.totalPages).toBe(expectedPages);
    }

    validateEmptyScenario(data: DtrEventsData) {
        if (data.totalCount !== 0) {
            return;
        }
        expect(data.rows.length).toBe(0);
        expect(data.totalPages).toBe(0);
    }

    validateRowsPresentWhenTotalPositive(data: DtrEventsData) {
        if (data.totalCount > 0) {
            expect(data.rows.length).toBeGreaterThan(0);
            expect(data.totalPages).toBeGreaterThan(0);
        }
    }

    validateDataPresentPagination(data: DtrEventsData) {
        if (data.rows.length === 0) {
            return;
        }
        expect(data.totalCount).toBeGreaterThan(0);
        expect(data.totalPages).toBeGreaterThan(0);
    }

    validateRowRequiredFields(rows: DtrEventRow[]) {
        rows.forEach((row) => {
            ROW_REQUIRED_FIELDS.forEach((field) => {
                expect(row).toHaveProperty(field);
            });
        });
    }

    validateRowStructure(rows: DtrEventRow[]) {
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
            expect(ALLOWED_STATUSES).toContain(row.status);
        });
    }

    validateSerialSequence(rows: DtrEventRow[], page: number, pageSize: number) {
        const base = (page - 1) * pageSize;
        rows.forEach((row, index) => {
            expect(row.serialNo).toBe(base + index + 1);
        });
    }

    validateUniqueSerialNumbers(rows: DtrEventRow[]) {
        const serials = rows.map((row) => row.serialNo);
        expect(new Set(serials).size).toBe(serials.length);
    }

    validateStatusRules(rows: DtrEventRow[]) {
        rows.forEach((row) => {
            if (row.status === "Resolved") {
                // Backend marks Resolved when durationSeconds != null; restoredDateTime
                // is only computed when durationSeconds > 0 (instant resolution → null).
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

    validateDateTimeFormat(rows: DtrEventRow[]) {
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

    validateDurationFormat(rows: DtrEventRow[]) {
        rows.forEach((row) => {
            if (row.status !== "Resolved" || row.duration == null) {
                return;
            }
            expect(HUMAN_DURATION.test(row.duration.trim())).toBeTruthy();
        });
    }

    validateMeterSlNo(rows: DtrEventRow[]) {
        rows.forEach((row) => {
            if (row.meterSlNo == null) {
                return;
            }
            expect(row.meterSlNo.trim().length).toBeGreaterThan(0);
        });
    }

    validateMeterSlNoConsistency(rows: DtrEventRow[]) {
        const meterSerials = rows
            .map((row) => row.meterSlNo?.trim())
            .filter((value): value is string => Boolean(value));
        if (meterSerials.length < 2) {
            return;
        }
        expect(new Set(meterSerials).size).toBe(1);
    }

    validateDescription(rows: DtrEventRow[]) {
        rows.forEach((row) => {
            if (row.description == null) {
                return;
            }
            expect(typeof row.description).toBe("string");
        });
    }

    validateRestoreAfterOccurrence(rows: DtrEventRow[]) {
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

    validateChronologicalOrder(rows: DtrEventRow[]) {
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

    validateStatusDistribution(rows: DtrEventRow[]) {
        const statuses = rows.map((row) => row.status);
        statuses.forEach((status) => {
            expect(ALLOWED_STATUSES).toContain(status);
        });
    }

    validateBusinessRules(data: DtrEventsData) {
        expect(data).toHaveProperty("rows");
        expect(data).toHaveProperty("page");
        expect(data).toHaveProperty("pageSize");
        expect(data).toHaveProperty("totalCount");
        expect(data).toHaveProperty("totalPages");
    }
}
