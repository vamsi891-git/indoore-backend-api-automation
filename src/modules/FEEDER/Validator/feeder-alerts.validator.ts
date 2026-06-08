import { expect } from "@playwright/test";
import { FeederAlertRow, FeederAlertsData } from "../Mapper/feeder-alerts.mapper";

const ALLOWED_STATUSES = ["Active", "Resolved"] as const;
const ROW_REQUIRED_FIELDS = [
    "serialNo",
    "eventType",
    "meterNumber",
    "occurredOn",
    "duration",
    "status",
] as const;
// Backend formatDurationHuman: e.g. "0m 10s", "1m 47s", "2h 5m 30s"
const HUMAN_DURATION =
    /^\d+h(?:\s+\d+m)?(?:\s+\d+s)?$|^\d+m(?:\s+\d+s)?$/;
const IST_DATE_TIME =
    /^\d{1,2}[\s/-](?:\w{3}|\d{2})[\s/-]\d{4}.+\d{1,2}:\d{2}|^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/i;

function parseOccurredOn(value: string): number | null {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export class FeederAlertsValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: FeederAlertsData) {
        expect(Array.isArray(data.rows)).toBeTruthy();
        expect(typeof data.page).toBe("number");
        expect(typeof data.pageSize).toBe("number");
        expect(typeof data.totalCount).toBe("number");
        expect(typeof data.totalPages).toBe("number");
    }

    validateQueryEcho(data: FeederAlertsData, page: number, limit: number) {
        expect(data.page).toBe(page);
        expect(data.pageSize).toBe(limit);
    }

    validatePaginationBounds(data: FeederAlertsData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.pageSize).toBeGreaterThan(0);
        expect(data.totalCount).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);
    }

    validatePaginationMath(data: FeederAlertsData) {
        if (data.totalCount === 0) {
            expect(data.rows.length).toBe(0);
            expect(data.totalPages).toBe(0);
            return;
        }

        expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
        const expectedPages = Math.ceil(data.totalCount / data.pageSize);
        expect(data.totalPages).toBe(expectedPages);
    }

    validateEmptyScenario(data: FeederAlertsData) {
        if (data.totalCount !== 0) {
            return;
        }
        expect(data.rows.length).toBe(0);
        expect(data.totalPages).toBe(0);
    }

    validateRowsPresentWhenTotalPositive(data: FeederAlertsData) {
        if (data.totalCount > 0) {
            expect(data.rows.length).toBeGreaterThan(0);
            expect(data.totalPages).toBeGreaterThan(0);
        }
    }

    validateDataPresentPagination(data: FeederAlertsData) {
        if (data.rows.length === 0) {
            return;
        }
        expect(data.totalCount).toBeGreaterThan(0);
        expect(data.totalPages).toBeGreaterThan(0);
    }

    validateRowRequiredFields(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            ROW_REQUIRED_FIELDS.forEach((field) => {
                expect(row).toHaveProperty(field);
            });
        });
    }

    validateRowStructure(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            expect(typeof row.serialNo).toBe("number");
            expect(row.serialNo).toBeGreaterThan(0);
            expect(
                row.eventType === null || typeof row.eventType === "string",
            ).toBeTruthy();
            expect(
                row.meterNumber === null || typeof row.meterNumber === "string",
            ).toBeTruthy();
            expect(typeof row.occurredOn).toBe("string");
            expect(row.occurredOn.length).toBeGreaterThan(0);
            expect(
                row.duration === null || typeof row.duration === "string",
            ).toBeTruthy();
            expect(ALLOWED_STATUSES).toContain(row.status);
        });
    }

    validateSerialSequence(
        rows: FeederAlertRow[],
        page: number,
        pageSize: number,
    ) {
        const base = (page - 1) * pageSize;
        rows.forEach((row, index) => {
            expect(row.serialNo).toBe(base + index + 1);
        });
    }

    validateUniqueSerialNumbers(rows: FeederAlertRow[]) {
        const serials = rows.map((row) => row.serialNo);
        expect(new Set(serials).size).toBe(serials.length);
    }

    validateStatusRules(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            if (row.status === "Resolved") {
                // Backend: Resolved when durationSeconds != null && durationSeconds > 0
                expect(row.duration).toBeTruthy();
                expect(HUMAN_DURATION.test(row.duration!.trim())).toBeTruthy();
            } else {
                expect(row.status).toBe("Active");
            }
        });
    }

    validateOccurredOnFormat(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            expect(row.occurredOn.trim().length).toBeGreaterThan(0);
            expect(IST_DATE_TIME.test(row.occurredOn.trim())).toBeTruthy();
        });
    }

    validateDurationFormat(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            if (row.duration == null || row.duration.trim().length === 0) {
                return;
            }
            expect(HUMAN_DURATION.test(row.duration.trim())).toBeTruthy();
        });
    }

    validateMeterNumber(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            if (row.meterNumber == null) {
                return;
            }
            expect(row.meterNumber.trim().length).toBeGreaterThan(0);
        });
    }

    validateEventType(rows: FeederAlertRow[]) {
        rows.forEach((row) => {
            if (row.eventType == null) {
                return;
            }
            expect(typeof row.eventType).toBe("string");
        });
    }

    validateChronologicalOrder(rows: FeederAlertRow[]) {
        if (rows.length < 2) {
            return;
        }
        for (let i = 0; i < rows.length - 1; i++) {
            const current = parseOccurredOn(rows[i].occurredOn);
            const next = parseOccurredOn(rows[i + 1].occurredOn);
            if (current != null && next != null) {
                expect(current).toBeGreaterThanOrEqual(next);
            }
        }
    }

    validateStatusDistribution(rows: FeederAlertRow[]) {
        const statuses = rows.map((row) => row.status);
        statuses.forEach((status) => {
            expect(ALLOWED_STATUSES).toContain(status);
        });
    }

    validateBusinessRules(data: FeederAlertsData) {
        expect(data).toHaveProperty("rows");
        expect(data).toHaveProperty("page");
        expect(data).toHaveProperty("pageSize");
        expect(data).toHaveProperty("totalCount");
        expect(data).toHaveProperty("totalPages");
    }
}
