import { expect } from "@playwright/test";
import {
    DTR_COMMUNICATION_DETAILS_COLUMN_KEYS,
    dtrCommunicationDetailsAccessTokenInvalidMessage,
    dtrCommunicationDetailsSuccessMessage,
    dtrCommunicationDetailsUnauthorizedMessage,
    statusForScenario,
} from "../Data/dtrcommunicationdetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { DtrCommunicationDetailsQuery } from "../Api/dtrcommunicationdetails.api";
import type {
    DtrCommunicationDetailsErrorResponse,
    DtrCommunicationDetailsResponse,
    DtrCommunicationDetailsScenario,
    DtrCommunicationDetailsStatus,
    MappedDtrCommunicationDetails,
} from "../Mapper/dtrcommunicationdetails.mapper";

function expectedRowStatusLabel(
    status: DtrCommunicationDetailsStatus,
): string {
    return status === "communicated" ? "Communicated" : "Non-Communicating";
}

export class DtrCommunicationDetailsValidator {
    validateResponseEnvelope(
        response: DtrCommunicationDetailsResponse,
    ): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.columns)).toBeTruthy();
        expect(Array.isArray(response.data?.rows)).toBeTruthy();
        expect(response.data?.pagination).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(dtrCommunicationDetailsSuccessMessage);
        }
    }

    validateColumns(mapped: MappedDtrCommunicationDetails): void {
        expect(mapped.columns.length).toBe(
            DTR_COMMUNICATION_DETAILS_COLUMN_KEYS.length,
        );
        const keys = mapped.columns.map((c) => c.key);
        expect(new Set(keys).size).toBe(keys.length);
        mapped.columns.forEach((column) => {
            expect(column.key).toBeTruthy();
            expect(column.header).toBeTruthy();
        });
        expect(keys).toEqual([...DTR_COMMUNICATION_DETAILS_COLUMN_KEYS]);
    }

    /**
     * Every column key must exist on each row. Row-only `id` is allowed
     * (`meter-{msn}` identity omitted from column metadata).
     */
    validateColumnKeysMatchRows(mapped: MappedDtrCommunicationDetails): void {
        const columnKeys = mapped.columns.map((c) => c.key);
        for (const row of mapped.rows) {
            for (const key of columnKeys) {
                expect(Object.prototype.hasOwnProperty.call(row, key)).toBe(
                    true,
                );
            }
            if (row.id != null) {
                expect(String(row.id).trim().length).toBeGreaterThan(0);
            }
        }
    }

    validateRowMetricShapes(
        mapped: MappedDtrCommunicationDetails,
        status: DtrCommunicationDetailsStatus,
    ): void {
        const expectedStatus = expectedRowStatusLabel(status);
        for (const row of mapped.rows) {
            expect(String(row.status ?? "").trim()).toBe(expectedStatus);
            expect(String(row.msn ?? "").trim().length).toBeGreaterThan(0);
            expect(String(row.dtr ?? "").trim().length).toBeGreaterThan(0);
            // lastSeen may be null (common for non-communicated); when present must be text.
            if (row.lastSeen != null) {
                expect(String(row.lastSeen).trim().length).toBeGreaterThan(0);
            }
        }
    }

    validatePagination(
        mapped: MappedDtrCommunicationDetails,
        query: DtrCommunicationDetailsQuery,
    ): void {
        const { page, limit, total, totalPages } = mapped.pagination;
        expect(page).toBe(query.page ?? 1);
        expect(limit).toBe(query.limit ?? 10);
        expect(page).toBeGreaterThan(0);
        expect(limit).toBeGreaterThan(0);
        expect(total).toBeGreaterThanOrEqual(0);
        expect(totalPages).toBeGreaterThanOrEqual(0);
        expect(mapped.rows.length).toBeLessThanOrEqual(limit);

        if (total === 0) {
            expect(totalPages).toBe(0);
            expect(mapped.rows.length).toBe(0);
            return;
        }

        expect(totalPages).toBe(Math.ceil(total / limit));
        if (totalPages === 1) {
            expect(total).toBe(mapped.rows.length);
        }
        if (page < totalPages) {
            expect(mapped.rows.length).toBe(limit);
        } else if (page === totalPages) {
            const remainder = total % limit;
            const expectedRows = remainder === 0 ? limit : remainder;
            expect(mapped.rows.length).toBe(expectedRows);
        }
    }

    validateLiveOk(
        mapped: MappedDtrCommunicationDetails,
        query: DtrCommunicationDetailsQuery,
    ): void {
        expect(mapped.success).toBeTruthy();
        this.validateColumns(mapped);
        this.validatePagination(mapped, query);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, query.status);
    }

    validateEmptyContract(mapped: MappedDtrCommunicationDetails): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validateNonCommunicatedWithRowsContract(
        mapped: MappedDtrCommunicationDetails,
    ): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(1134);
        expect(mapped.pagination.totalPages).toBe(114);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, "non-communicated");
        expect(mapped.rows[0]?.id).toBe("meter-19271515");
        expect(mapped.rows[0]?.msn).toBe("19271515");
        expect(mapped.rows[0]?.status).toBe("Non-Communicating");
        expect(mapped.rows[0]?.lastSeen).toBeNull();
    }

    validateCommunicatedWithRowsContract(
        mapped: MappedDtrCommunicationDetails,
    ): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(1);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, "communicated");
        expect(mapped.rows[0]?.status).toBe("Communicated");
        expect(String(mapped.rows[0]?.lastSeen).trim().length).toBeGreaterThan(
            0,
        );
    }

    validateAuthError(
        responseBody: DtrCommunicationDetailsErrorResponse,
        expectedCode: string,
        expectedMessage: string,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe(expectedCode);
        expect(responseBody.error.message.toLowerCase()).toContain(
            expectedMessage.toLowerCase(),
        );
    }

    validateLegacyStatusValidationError(
        responseBody: DtrCommunicationDetailsErrorResponse,
    ): void {
        expect(responseBody.success).toBe(false);
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(String(responseBody.error.message).toLowerCase()).toMatch(
            /communicat|status|enum|invalid/i,
        );
    }

    validateUnauthorizedError(
        responseBody: DtrCommunicationDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrCommunicationDetailsUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrCommunicationDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrCommunicationDetailsAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrCommunicationDetails,
        scenario: DtrCommunicationDetailsScenario,
        query?: DtrCommunicationDetailsQuery,
    ): void {
        const status = statusForScenario(scenario);
        const effectiveQuery: DtrCommunicationDetailsQuery = query ?? {
            status,
            page: 1,
            limit: 10,
        };

        switch (scenario) {
            case "contract_communicated_empty":
            case "contract_non_communicated_empty":
                this.validateEmptyContract(mapped);
                break;
            case "contract_non_communicated_with_rows":
                this.validateNonCommunicatedWithRowsContract(mapped);
                break;
            case "contract_communicated_with_rows":
                this.validateCommunicatedWithRowsContract(mapped);
                break;
            case "dev_live_communicated":
            case "dev_live_non_communicated":
            case "dev_live_page_limit":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, effectiveQuery);
                break;
            case "dev_reject_legacy_status":
                // Handled via validateLegacyStatusValidationError on error body.
                break;
            default: {
                const _exhaustive: never = scenario;
                void _exhaustive;
            }
        }
    }
}
