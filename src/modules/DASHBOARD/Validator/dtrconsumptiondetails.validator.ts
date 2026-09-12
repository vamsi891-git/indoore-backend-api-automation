import { expect } from "@playwright/test";
import {
    DTR_CONSUMPTION_DETAILS_KIND_HEADERS,
    columnKeysForKind,
    dtrConsumptionDetailsAccessTokenInvalidMessage,
    dtrConsumptionDetailsSuccessMessage,
    dtrConsumptionDetailsUnauthorizedMessage,
    kindForScenario,
} from "../Data/dtrconsumptiondetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { DtrConsumptionDetailsQuery } from "../Api/dtrconsumptiondetails.api";
import type {
    DtrConsumptionDetailsErrorResponse,
    DtrConsumptionDetailsKind,
    DtrConsumptionDetailsResponse,
    DtrConsumptionDetailsScenario,
    MappedDtrConsumptionDetails,
} from "../Mapper/dtrconsumptiondetails.mapper";

export class DtrConsumptionDetailsValidator {
    validateResponseEnvelope(
        response: DtrConsumptionDetailsResponse,
    ): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.columns)).toBeTruthy();
        expect(Array.isArray(response.data?.rows)).toBeTruthy();
        expect(response.data?.pagination).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(dtrConsumptionDetailsSuccessMessage);
        }
    }

    validateColumns(
        mapped: MappedDtrConsumptionDetails,
        kind: DtrConsumptionDetailsKind,
    ): void {
        const expectedKeys = columnKeysForKind(kind);
        expect(mapped.columns.length).toBe(expectedKeys.length);
        const keys = mapped.columns.map((c) => c.key);
        expect(new Set(keys).size).toBe(keys.length);
        mapped.columns.forEach((column) => {
            expect(column.key).toBeTruthy();
            expect(column.header).toBeTruthy();
        });
        expect(keys).toEqual(expectedKeys);
        const metricCol = mapped.columns.find((c) => c.key === kind);
        expect(metricCol?.header).toBe(DTR_CONSUMPTION_DETAILS_KIND_HEADERS[kind]);
    }

    /**
     * Every column key must exist on each row. Row-only `id` is allowed
     * (`meter-{msn}` identity omitted from column metadata).
     */
    validateColumnKeysMatchRows(mapped: MappedDtrConsumptionDetails): void {
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
        mapped: MappedDtrConsumptionDetails,
        kind: DtrConsumptionDetailsKind,
    ): void {
        for (const row of mapped.rows) {
            expect(String(row.msn ?? "").trim().length).toBeGreaterThan(0);
            expect(String(row.dtr ?? "").trim().length).toBeGreaterThan(0);
            const metric = Number(row[kind]);
            expect(Number.isFinite(metric)).toBe(true);
            expect(metric).toBeGreaterThanOrEqual(0);
            // logDate may be null when no LS snapshot; when present must be text.
            if (row.logDate != null) {
                expect(String(row.logDate).trim().length).toBeGreaterThan(0);
            }
        }
    }

    validatePagination(
        mapped: MappedDtrConsumptionDetails,
        query: DtrConsumptionDetailsQuery,
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
        mapped: MappedDtrConsumptionDetails,
        query: DtrConsumptionDetailsQuery,
    ): void {
        expect(mapped.success).toBeTruthy();
        this.validateColumns(mapped, query.kind);
        this.validatePagination(mapped, query);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, query.kind);
    }

    validateEmptyContract(
        mapped: MappedDtrConsumptionDetails,
        kind: DtrConsumptionDetailsKind,
    ): void {
        this.validateColumns(mapped, kind);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validateWithRowsContract(
        mapped: MappedDtrConsumptionDetails,
        kind: DtrConsumptionDetailsKind,
    ): void {
        this.validateColumns(mapped, kind);
        expect(mapped.pagination.total).toBe(1134);
        expect(mapped.pagination.totalPages).toBe(114);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, kind);
        expect(mapped.rows[0]?.id).toBe("meter-19271515");
        expect(mapped.rows[0]?.msn).toBe("19271515");
        expect(Number(mapped.rows[0]?.[kind])).toBe(0);
        expect(mapped.rows[0]?.logDate).toBeNull();
    }

    validateAuthError(
        responseBody: DtrConsumptionDetailsErrorResponse,
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
        responseBody: DtrConsumptionDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrConsumptionDetailsUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrConsumptionDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrConsumptionDetailsAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrConsumptionDetails,
        scenario: DtrConsumptionDetailsScenario,
        query?: DtrConsumptionDetailsQuery,
    ): void {
        const kind = kindForScenario(scenario);
        const effectiveQuery: DtrConsumptionDetailsQuery = query ?? {
            kind,
            page: 1,
            limit: 10,
        };

        switch (scenario) {
            case "contract_kwh_empty":
            case "contract_kvah_empty":
            case "contract_kvarh_empty":
                this.validateEmptyContract(mapped, kind);
                break;
            case "contract_kwh_with_rows":
            case "contract_kvah_with_rows":
            case "contract_kvarh_with_rows":
                this.validateWithRowsContract(mapped, kind);
                break;
            case "dev_live_kwh":
            case "dev_live_kvah":
            case "dev_live_kvarh":
            case "dev_live_page_limit":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, effectiveQuery);
                break;
            default:
                break;
        }
    }
}
