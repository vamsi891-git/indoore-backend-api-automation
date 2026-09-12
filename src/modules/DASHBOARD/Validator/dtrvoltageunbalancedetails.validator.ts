import { expect } from "@playwright/test";
import {
    DTR_VOLTAGE_UNBALANCE_DETAILS_CORE_COLUMN_KEYS,
    DTR_VOLTAGE_UNBALANCE_DETAILS_METRIC_KEYS_ANY_OF,
    DTR_VOLTAGE_UNBALANCE_DETAILS_PHASE_VOLTAGE_KEYS,
    dtrVoltageUnbalanceDetailsAccessTokenInvalidMessage,
    dtrVoltageUnbalanceDetailsSuccessMessage,
    dtrVoltageUnbalanceDetailsUnauthorizedMessage,
    severityForScenario,
} from "../Data/dtrvoltageunbalancedetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { DtrVoltageUnbalanceDetailsQuery } from "../Api/dtrvoltageunbalancedetails.api";
import type {
    DtrVoltageUnbalanceDetailsErrorResponse,
    DtrVoltageUnbalanceDetailsResponse,
    DtrVoltageUnbalanceDetailsScenario,
    DtrVoltageUnbalanceSeverity,
    MappedDtrVoltageUnbalanceDetails,
} from "../Mapper/dtrvoltageunbalancedetails.mapper";

export class DtrVoltageUnbalanceDetailsValidator {
    validateResponseEnvelope(
        response: DtrVoltageUnbalanceDetailsResponse,
    ): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.columns)).toBeTruthy();
        expect(Array.isArray(response.data?.rows)).toBeTruthy();
        expect(response.data?.pagination).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(
                dtrVoltageUnbalanceDetailsSuccessMessage,
            );
        }
    }

    validateColumns(
        mapped: MappedDtrVoltageUnbalanceDetails,
        severity: DtrVoltageUnbalanceSeverity,
    ): void {
        expect(mapped.columns.length).toBeGreaterThan(0);
        const keys = mapped.columns.map((c) => c.key);
        expect(new Set(keys).size).toBe(keys.length);
        mapped.columns.forEach((column) => {
            expect(column.key).toBeTruthy();
            expect(column.header).toBeTruthy();
        });

        for (const key of DTR_VOLTAGE_UNBALANCE_DETAILS_CORE_COLUMN_KEYS) {
            expect(keys).toContain(key);
        }
        for (const key of DTR_VOLTAGE_UNBALANCE_DETAILS_PHASE_VOLTAGE_KEYS) {
            expect(keys).toContain(key);
        }
        const hasUnbalanceMetric =
            DTR_VOLTAGE_UNBALANCE_DETAILS_METRIC_KEYS_ANY_OF.some((k) =>
                keys.includes(k),
            );
        expect(hasUnbalanceMetric).toBeTruthy();

        if (severity === "severe") {
            expect(keys).toContain("voltageUnbalance");
            expect(keys).toContain("perUV");
        } else {
            expect(keys).toContain("voltageUnbalance");
            expect(keys).toContain("vbn");
        }
    }

    /**
     * Every column key must exist on each row. Row-only `id` is allowed
     * (identity, omitted from column metadata — same pattern as load details).
     */
    validateColumnKeysMatchRows(
        mapped: MappedDtrVoltageUnbalanceDetails,
    ): void {
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

    validateRowMetricShapes(mapped: MappedDtrVoltageUnbalanceDetails): void {
        for (const row of mapped.rows) {
            expect(
                String(row.loadingCondition ?? "").trim().length,
            ).toBeGreaterThan(0);
            const unbalance = Number(
                row.voltageUnbalance ?? row.perUV ?? Number.NaN,
            );
            expect(Number.isFinite(unbalance)).toBeTruthy();
            expect(unbalance).toBeGreaterThanOrEqual(0);
            for (const phaseKey of ["vrn", "vyn", "vbn"] as const) {
                if (!(phaseKey in row) || row[phaseKey] == null) continue;
                const phase = Number(row[phaseKey]);
                expect(Number.isFinite(phase)).toBeTruthy();
            }
        }
    }

    validatePagination(
        mapped: MappedDtrVoltageUnbalanceDetails,
        query: DtrVoltageUnbalanceDetailsQuery,
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
        mapped: MappedDtrVoltageUnbalanceDetails,
        query: DtrVoltageUnbalanceDetailsQuery,
    ): void {
        expect(mapped.success).toBeTruthy();
        this.validateColumns(mapped, query.severity);
        this.validatePagination(mapped, query);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped);
    }

    validateEmptyContract(
        mapped: MappedDtrVoltageUnbalanceDetails,
        severity: DtrVoltageUnbalanceSeverity,
    ): void {
        this.validateColumns(mapped, severity);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validateSevereWithRowsContract(
        mapped: MappedDtrVoltageUnbalanceDetails,
    ): void {
        this.validateColumns(mapped, "severe");
        expect(mapped.pagination.total).toBe(1);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped);
        expect(Number(mapped.rows[0]?.voltageUnbalance)).toBeGreaterThan(0);
        expect(Number(mapped.rows[0]?.perUV)).toBe(1);
    }

    validateBalancedWithRowsContract(
        mapped: MappedDtrVoltageUnbalanceDetails,
    ): void {
        this.validateColumns(mapped, "balanced");
        expect(mapped.pagination.total).toBe(295);
        expect(mapped.pagination.totalPages).toBe(30);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped);
        expect(mapped.rows[0]?.id).toBe("row-1-m-1001");
        expect(mapped.rows[0]?.loadingCondition).toBe("<5%");
        expect(Number(mapped.rows[0]?.voltageUnbalance)).toBe(1.2);
        expect(Number(mapped.rows[0]?.vrn)).toBe(230.1);
        expect(Number(mapped.rows[0]?.vyn)).toBe(228.4);
        expect(Number(mapped.rows[0]?.vbn)).toBe(229);
    }

    validateAuthError(
        responseBody: DtrVoltageUnbalanceDetailsErrorResponse,
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
        responseBody: DtrVoltageUnbalanceDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrVoltageUnbalanceDetailsUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrVoltageUnbalanceDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrVoltageUnbalanceDetailsAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrVoltageUnbalanceDetails,
        scenario: DtrVoltageUnbalanceDetailsScenario,
        query?: DtrVoltageUnbalanceDetailsQuery,
    ): void {
        const severity = severityForScenario(scenario);
        const effectiveQuery: DtrVoltageUnbalanceDetailsQuery = query ?? {
            severity,
            page: 1,
            limit: 10,
        };

        switch (scenario) {
            case "contract_severe_empty":
            case "contract_moderate_empty":
            case "contract_balanced_empty":
                this.validateEmptyContract(mapped, severity);
                break;
            case "contract_severe_with_rows":
                this.validateSevereWithRowsContract(mapped);
                break;
            case "contract_balanced_with_rows":
                this.validateBalancedWithRowsContract(mapped);
                break;
            case "dev_live_severe":
            case "dev_live_moderate":
            case "dev_live_balanced":
            case "dev_live_page_limit":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, effectiveQuery);
                break;
            default:
                break;
        }
    }
}
