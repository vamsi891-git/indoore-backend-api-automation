import { expect } from "@playwright/test";
import { dtrEventsData } from "../Data/dtrevents.data";
import { DtrEventRow, DtrEventsData } from "../Mapper/dtrevents.mapper";

const ALLOWED_STATUSES = dtrEventsData.allowedStatuses;

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
    // =====================================
    // RESPONSE ENVELOPE
    // =====================================
    validateResponseEnvelope(response: { success: boolean; data: unknown }): void {
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
        if (data.totalCount > 0) {
            expect(data.rows.length).toBeGreaterThan(0);
            expect(data.totalPages).toBeGreaterThan(0);
        }
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
            for (const field of dtrEventsData.rowFields) {
                expect(row).toHaveProperty(field);
            }
            expect(Object.keys(row).sort()).toEqual(
                [...dtrEventsData.rowFields].sort(),
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
}
