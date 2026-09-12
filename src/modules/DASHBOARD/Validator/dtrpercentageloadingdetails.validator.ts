import { expect } from "@playwright/test";
import {
    DTR_PERCENTAGE_LOADING_DETAILS_BAND_ALIASES,
    DTR_PERCENTAGE_LOADING_DETAILS_BAND_LABELS,
    DTR_PERCENTAGE_LOADING_DETAILS_COLUMN_KEYS,
    bandForScenario,
    dtrPercentageLoadingDetailsAccessTokenInvalidMessage,
    dtrPercentageLoadingDetailsSuccessMessage,
    dtrPercentageLoadingDetailsUnauthorizedMessage,
} from "../Data/dtrpercentageloadingdetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { DtrPercentageLoadingDetailsQuery } from "../Api/dtrpercentageloadingdetails.api";
import type {
    DtrPercentageLoadingDetailsBand,
    DtrPercentageLoadingDetailsErrorResponse,
    DtrPercentageLoadingDetailsResponse,
    DtrPercentageLoadingDetailsScenario,
    MappedDtrPercentageLoadingDetails,
} from "../Mapper/dtrpercentageloadingdetails.mapper";

function normalizeCondition(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");
}

function conditionMatchesBand(
    loadingCondition: unknown,
    band: DtrPercentageLoadingDetailsBand,
): boolean {
    const actual = normalizeCondition(loadingCondition);
    if (!actual) return false;
    const aliases = DTR_PERCENTAGE_LOADING_DETAILS_BAND_ALIASES[band];
    return aliases.some((alias) => {
        const expected = normalizeCondition(alias);
        return (
            actual === expected ||
            actual === normalizeCondition(band) ||
            actual.replace(/\s/g, "") === expected.replace(/\s/g, "")
        );
    });
}

export class DtrPercentageLoadingDetailsValidator {
    validateResponseEnvelope(
        response: DtrPercentageLoadingDetailsResponse,
    ): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.columns)).toBeTruthy();
        expect(Array.isArray(response.data?.rows)).toBeTruthy();
        expect(response.data?.pagination).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(
                dtrPercentageLoadingDetailsSuccessMessage,
            );
        }
    }

    validateColumns(mapped: MappedDtrPercentageLoadingDetails): void {
        expect(mapped.columns.length).toBe(
            DTR_PERCENTAGE_LOADING_DETAILS_COLUMN_KEYS.length,
        );
        const keys = mapped.columns.map((c) => c.key);
        expect(new Set(keys).size).toBe(keys.length);
        mapped.columns.forEach((column) => {
            expect(column.key).toBeTruthy();
            expect(column.header).toBeTruthy();
        });
        expect(keys).toEqual([...DTR_PERCENTAGE_LOADING_DETAILS_COLUMN_KEYS]);
    }

    /**
     * Every column key must exist on each row. Row-only `id` is allowed
     * (`meter-{msn}` identity omitted from column metadata).
     */
    validateColumnKeysMatchRows(
        mapped: MappedDtrPercentageLoadingDetails,
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

    validateRowMetricShapes(
        mapped: MappedDtrPercentageLoadingDetails,
        band: DtrPercentageLoadingDetailsBand,
    ): void {
        for (const row of mapped.rows) {
            expect(String(row.msn ?? "").trim().length).toBeGreaterThan(0);
            expect(String(row.dtr ?? "").trim().length).toBeGreaterThan(0);
            expect(
                conditionMatchesBand(row.loadingCondition, band),
            ).toBeTruthy();

            const loadPercent = Number(row.loadPercent);
            expect(Number.isFinite(loadPercent)).toBe(true);
            expect(loadPercent).toBeGreaterThanOrEqual(0);

            if (row.loadingKva != null) {
                const loadingKva = Number(row.loadingKva);
                expect(Number.isFinite(loadingKva)).toBe(true);
                expect(loadingKva).toBeGreaterThanOrEqual(0);
            }

            if (row.dtrRating != null) {
                const rating = Number(row.dtrRating);
                expect(Number.isFinite(rating)).toBe(true);
                expect(rating).toBeGreaterThanOrEqual(0);
            }

            if (row.logDate != null) {
                expect(String(row.logDate).trim().length).toBeGreaterThan(0);
            }
        }
    }

    validatePagination(
        mapped: MappedDtrPercentageLoadingDetails,
        query: DtrPercentageLoadingDetailsQuery,
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
        mapped: MappedDtrPercentageLoadingDetails,
        query: DtrPercentageLoadingDetailsQuery,
    ): void {
        expect(mapped.success).toBeTruthy();
        this.validateColumns(mapped);
        this.validatePagination(mapped, query);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, query.band);
    }

    validateEmptyContract(mapped: MappedDtrPercentageLoadingDetails): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
        expect(mapped.rows.length).toBe(0);
    }

    validateWithRowsContract(
        mapped: MappedDtrPercentageLoadingDetails,
        band: DtrPercentageLoadingDetailsBand,
    ): void {
        this.validateColumns(mapped);
        expect(mapped.pagination.total).toBe(1);
        expect(mapped.pagination.totalPages).toBe(1);
        expect(mapped.rows.length).toBe(1);
        this.validateColumnKeysMatchRows(mapped);
        this.validateRowMetricShapes(mapped, band);
        expect(mapped.rows[0]?.id).toBe("meter-19271515");
        expect(mapped.rows[0]?.msn).toBe("19271515");
        expect(mapped.rows[0]?.loadingCondition).toBe(
            DTR_PERCENTAGE_LOADING_DETAILS_BAND_LABELS[band],
        );
        expect(Number(mapped.rows[0]?.loadPercent)).toBe(0);
        expect(Number(mapped.rows[0]?.loadingKva)).toBe(0);
        expect(Number(mapped.rows[0]?.dtrRating)).toBe(100);
        expect(mapped.rows[0]?.logDate).toBeNull();
    }

    validateAuthError(
        responseBody: DtrPercentageLoadingDetailsErrorResponse,
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
        responseBody: DtrPercentageLoadingDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrPercentageLoadingDetailsUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrPercentageLoadingDetailsErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrPercentageLoadingDetailsAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrPercentageLoadingDetails,
        scenario: DtrPercentageLoadingDetailsScenario,
        query?: DtrPercentageLoadingDetailsQuery,
    ): void {
        const band = bandForScenario(scenario);
        const effectiveQuery: DtrPercentageLoadingDetailsQuery = query ?? {
            band,
            page: 1,
            limit: 10,
        };

        switch (scenario) {
            case "contract_critical_empty":
            case "contract_high_load_empty":
            case "contract_normal_empty":
            case "contract_under_utilized_empty":
                this.validateEmptyContract(mapped);
                break;
            case "contract_critical_with_rows":
            case "contract_high_load_with_rows":
            case "contract_normal_with_rows":
            case "contract_under_utilized_with_rows":
                this.validateWithRowsContract(mapped, band);
                break;
            case "dev_live_critical":
            case "dev_live_high_load":
            case "dev_live_normal":
            case "dev_live_under_utilized":
            case "dev_live_page_limit":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, effectiveQuery);
                break;
            default:
                break;
        }
    }
}
