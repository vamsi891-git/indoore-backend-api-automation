import { expect } from "@playwright/test";
import { eventLogListContractPaginationMeta } from "../Data/eventloglist.data";
import type {
    EventLogListData,
    EventLogListErrorResponse,
    EventLogListScenario,
    EventLogRow,
    MappedEventLogList,
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
    /^\d{1,2}[\s/-](?:[A-Za-z]{3,4}|\d{2})[\s/-]\d{4}.+\d{1,2}:\d{2}|^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/i;

function parseEventDateTime(value: string): number | null {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export class EventLogListValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateNotFoundError(responseBody: EventLogListErrorResponse) {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
        expect(responseBody.error.message.toLowerCase()).toContain(
            "consumer not found",
        );
    }

    validateBlankRefError(responseBody: EventLogListErrorResponse) {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
        const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
        expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
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

    validateLiveOk(mapped: MappedEventLogList) {
        this.validateSuccess(mapped.success);
        this.validateRootStructure(mapped);
        this.validatePaginationBounds(mapped);
        this.validatePaginationMath(mapped);
        this.validateEmptyScenario(mapped);
        this.validateRowsPresentWhenTotalPositive(mapped);
        this.validateBusinessRules(mapped);

        if (mapped.rows.length > 0) {
            this.validateDataPresentPagination(mapped);
            this.validateRowRequiredFields(mapped.rows);
            this.validateRowStructure(mapped.rows);
            this.validateSerialSequence(mapped.rows, mapped.page, mapped.pageSize);
            this.validateUniqueSerialNumbers(mapped.rows);
            this.validateStatusRules(mapped.rows);
            this.validateStatusDistribution(mapped.rows);
            this.validateMeterNo(mapped.rows);
            this.validateMeterNoConsistency(mapped.rows);
            this.validateDescription(mapped.rows);
            this.validateDateTimeFormat(mapped.rows);
            this.validateDurationDisplayFormat(mapped.rows);
            this.validateRestoreAfterOccurrence(mapped.rows);
            this.validateChronologicalOrder(mapped.rows);
        }
    }

    /**
     * Widget resilience — unknown routes may return HTTP 200 with
     * getEmptyEventLogPage (rows=[], totalCount=0, totalPages=0).
     */
    validateGracefulEmptyFallback(
        mapped: MappedEventLogList,
        eventPage: number,
        eventPageSize: number,
    ) {
        this.validateLiveOk(mapped);
        expect(mapped.rows.length).toBe(0);
        expect(mapped.totalCount).toBe(0);
        expect(mapped.totalPages).toBe(0);
        expect(mapped.page).toBe(eventPage);
        expect(mapped.pageSize).toBe(eventPageSize);
    }

    validateEmptyContract(mapped: MappedEventLogList) {
        this.validateGracefulEmptyFallback(mapped, 1, 10);
    }

    validatePaginationContract(mapped: MappedEventLogList) {
        this.validateLiveOk(mapped);
        const meta = eventLogListContractPaginationMeta;
        expect(mapped.page).toBe(meta.page);
        expect(mapped.pageSize).toBe(meta.pageSize);
        expect(mapped.totalCount).toBe(meta.totalCount);
        expect(mapped.totalPages).toBe(meta.expectedTotalPages);
        expect(mapped.rows.length).toBe(5);
        expect(mapped.rows[0]?.serialNo).toBe(meta.expectedSerialStart);
    }

    validateResolvedPendingContract(mapped: MappedEventLogList) {
        this.validateLiveOk(mapped);
        expect(mapped.rows.length).toBe(2);

        const resolved = mapped.rows.find((row) => row.status === "Resolved");
        const pending = mapped.rows.find((row) => row.status === "Pending");
        expect(resolved).toBeDefined();
        expect(pending).toBeDefined();
        expect(resolved!.restoreDateTime).toBeTruthy();
        expect(resolved!.durationDisplay).toBeTruthy();
        expect(pending!.restoreDateTime).toBeNull();
    }

    validateScenario(
        mapped: MappedEventLogList,
        scenario: EventLogListScenario,
        query: { eventPage: number; eventPageSize: number },
    ) {
        switch (scenario) {
            case "contract_empty_list":
                this.validateEmptyContract(mapped);
                break;
            case "contract_pagination":
                this.validatePaginationContract(mapped);
                break;
            case "contract_resolved_pending_rows":
                this.validateResolvedPendingContract(mapped);
                break;
            case "ell_by_ivrs":
            case "ell_by_account":
            case "ell_by_meter":
            case "ell_page_2":
            case "ell_ignore_unknown_query":
                this.validateLiveOk(mapped);
                this.validateQueryEcho(mapped, query.eventPage, query.eventPageSize);
                break;
            case "ell_with_search":
                // Search may return zero rows while totalCount stays unfiltered.
                this.validateSuccess(mapped.success);
                this.validateRootStructure(mapped);
                this.validatePaginationBounds(mapped);
                this.validateBusinessRules(mapped);
                this.validateQueryEcho(mapped, query.eventPage, query.eventPageSize);
                if (mapped.rows.length > 0) {
                    this.validateDataPresentPagination(mapped);
                    this.validateRowRequiredFields(mapped.rows);
                    this.validateRowStructure(mapped.rows);
                    this.validateSerialSequence(
                        mapped.rows,
                        mapped.page,
                        mapped.pageSize,
                    );
                    this.validateUniqueSerialNumbers(mapped.rows);
                    this.validateStatusRules(mapped.rows);
                    this.validateStatusDistribution(mapped.rows);
                    this.validateMeterNo(mapped.rows);
                    this.validateMeterNoConsistency(mapped.rows);
                    this.validateDescription(mapped.rows);
                    this.validateDateTimeFormat(mapped.rows);
                    this.validateDurationDisplayFormat(mapped.rows);
                    this.validateRestoreAfterOccurrence(mapped.rows);
                    this.validateChronologicalOrder(mapped.rows);
                }
                break;
            case "meter_not_found":
            case "consumer_not_found":
                this.validateGracefulEmptyFallback(
                    mapped,
                    query.eventPage,
                    query.eventPageSize,
                );
                break;
            default:
                break;
        }
    }
}
