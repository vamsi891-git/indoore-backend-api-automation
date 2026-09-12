import { expect } from "@playwright/test";
import {
    DTR_POWER_STATUS_DETAILS_COLUMN_KEYS,
    dtrPowerStatusDetailsAccessTokenInvalidMessage,
    dtrPowerStatusDetailsSuccessMessage,
    dtrPowerStatusDetailsUnauthorizedMessage,
    statusForScenario,
} from "../Data/dtrpowerstatusdetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { DtrPowerStatusDetailsQuery } from "../Api/dtrpowerstatusdetails.api";
import type {
    DtrPowerStatusDetailsErrorResponse,
    DtrPowerStatusDetailsResponse,
    DtrPowerStatusDetailsScenario,
    DtrPowerStatusDetailsStatus,
    MappedDtrPowerStatusDetails,
} from "../Mapper/dtrpowerstatusdetails.mapper";

export class DtrPowerStatusDetailsValidator {
    validateResponseEnvelope(
        response: DtrPowerStatusDetailsResponse,
    ): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.columns)).toBeTruthy();
        expect(Array.isArray(response.data?.rows)).toBeTruthy();
        expect(response.data?.pagination).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(dtrPowerStatusDetailsSuccessMessage);
        }
    }

    validateColumns(mapped: MappedDtrPowerStatusDetails): void {
        expect(mapped.columns.length).toBe(
            DTR_POWER_STATUS_DETAILS_COLUMN_KEYS.length,
        );
        const keys = mapped.columns.map((c) => c.key);
        expect(new Set(keys).size).toBe(keys.length);
        mapped.columns.forEach((column) => {
            expect(column.key).toBeTruthy();
            expect(column.header).toBeTruthy();
        });
        expect(keys).toEqual([...DTR_POWER_STATUS_DETAILS_COLUMN_KEYS]);
    }

    /**
     * Every column key must exist on each row. Row-only `id` is allowed
     * (`meter-{msn}` identity omitted from column metadata).
     */
    validateColumnKeysMatchRows(mapped: MappedDtrPowerStatusDetails): void {
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
        mapped: MappedDtrPowerStatusDetails,
        status: DtrPowerStatusDetailsStatus,
    ): void {
        const expectedStatus = status === "on" ? "ON" : "OFF";
        for (const row of mapped.rows) {
            expect(String(row.status ?? "").toUpperCase()).toBe(expectedStatus);
            expect(String(row.msn ?? "").trim().length).toBeGreaterThan(0);
            expect(String(row.dtr ?? "").trim().length).toBeGreaterThan(0);
            // lastAlarmAt may be null (common for ON); when present must be non-empty text.
            if (row.lastAlarmAt != null) {
                expect(String(row.lastAlarmAt).trim().length).toBeGreaterThan(0);
            }
        }
    }

    validatePagination(
        mapped: MappedDtrPowerStatusDetails,
        query: DtrPowerStatusDetailsQuery,
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
        mapped: MappedDtrPowerStatusDetails,
        query: DtrPowerStatusDetailsQuery,
    ): void {
        expect(mapped.success).toBeTruthy();
        this.validateColumns(mapped);
        this.validatePagination(mapped, query);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, query.status);
    }

    validateEmptyContract(mapped: MappedDtrPowerStatusDetails): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validateOnWithRowsContract(mapped: MappedDtrPowerStatusDetails): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(1134);
        expect(mapped.pagination.totalPages).toBe(114);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, "on");
        expect(mapped.rows[0]?.id).toBe("meter-19271515");
        expect(mapped.rows[0]?.msn).toBe("19271515");
        expect(mapped.rows[0]?.status).toBe("ON");
        expect(mapped.rows[0]?.lastAlarmAt).toBeNull();
    }

    validateOffWithRowsContract(mapped: MappedDtrPowerStatusDetails): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(1);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, "off");
        expect(mapped.rows[0]?.status).toBe("OFF");
        expect(String(mapped.rows[0]?.lastAlarmAt).trim().length).toBeGreaterThan(
            0,
        );
    }

    validateAuthError(
        responseBody: DtrPowerStatusDetailsErrorResponse,
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

    validateUnauthorizedError(
        responseBody: DtrPowerStatusDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrPowerStatusDetailsUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrPowerStatusDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrPowerStatusDetailsAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrPowerStatusDetails,
        scenario: DtrPowerStatusDetailsScenario,
        query?: DtrPowerStatusDetailsQuery,
    ): void {
        const status = statusForScenario(scenario);
        const effectiveQuery: DtrPowerStatusDetailsQuery = query ?? {
            status,
            page: 1,
            limit: 10,
        };

        switch (scenario) {
            case "contract_on_empty":
            case "contract_off_empty":
                this.validateEmptyContract(mapped);
                break;
            case "contract_on_with_rows":
                this.validateOnWithRowsContract(mapped);
                break;
            case "contract_off_with_rows":
                this.validateOffWithRowsContract(mapped);
                break;
            case "dev_live_on":
            case "dev_live_off":
            case "dev_live_page_limit":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, effectiveQuery);
                break;
            default:
                break;
        }
    }
}
