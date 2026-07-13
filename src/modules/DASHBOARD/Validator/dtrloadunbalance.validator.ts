import { expect } from "@playwright/test";
import {
    dtrLoadUnbalanceAccessTokenInvalidMessage,
    dtrLoadUnbalanceSuccessMessage,
    dtrLoadUnbalanceUnauthorizedMessage,
} from "../Data/dtrloadunbalance.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
    DTR_LOAD_UNBALANCE_LABELS,
    type DtrLoadUnbalanceErrorResponse,
    type DtrLoadUnbalanceResponse,
    type DtrLoadUnbalanceScenario,
    type MappedDtrLoadUnbalance,
} from "../Mapper/dtrloadunbalance.mapper";

export class DtrLoadUnbalanceValidator {
    validateResponseEnvelope(response: DtrLoadUnbalanceResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBeTruthy();
        if (response.message != null) {
            expect(response.message).toBe(dtrLoadUnbalanceSuccessMessage);
        }
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validateItemShape(mapped: MappedDtrLoadUnbalance): void {
        expect(mapped.items.length).toBe(DTR_LOAD_UNBALANCE_LABELS.length);

        mapped.items.forEach((item) => {
            expect(item.label).toBeTruthy();
            expect(typeof item.label).toBe("string");
            expect(typeof item.value).toBe("number");
            expect(typeof item.percentage).toBe("number");
            expect(Number.isFinite(item.value)).toBeTruthy();
            expect(Number.isFinite(item.percentage)).toBeTruthy();
            expect(item.value).toBeGreaterThanOrEqual(0);
            expect(item.percentage).toBeGreaterThanOrEqual(0);
            expect(item.percentage).toBeLessThanOrEqual(100);
        });
    }

    validateExpectedLabels(mapped: MappedDtrLoadUnbalance): void {
        const labels = mapped.items.map((item) => item.label);
        expect(labels).toEqual([...DTR_LOAD_UNBALANCE_LABELS]);
    }

    validateUniqueLabels(mapped: MappedDtrLoadUnbalance): void {
        const labels = mapped.items.map((item) => item.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    validatePercentageTotal(mapped: MappedDtrLoadUnbalance, tolerance = 1): void {
        const totalValue = mapped.items.reduce((sum, item) => sum + item.value, 0);
        const totalPercentage = mapped.items.reduce(
            (sum, item) => sum + item.percentage,
            0,
        );

        if (totalValue === 0) {
            expect(totalPercentage).toBe(0);
            return;
        }

        expect(Math.abs(100 - totalPercentage)).toBeLessThanOrEqual(tolerance);
    }

    validatePercentageConsistency(
        mapped: MappedDtrLoadUnbalance,
        tolerance = 1,
    ): void {
        const totalValue = mapped.items.reduce((sum, item) => sum + item.value, 0);
        if (totalValue === 0) {
            mapped.items.forEach((item) => {
                expect(item.percentage).toBe(0);
            });
            return;
        }

        mapped.items.forEach((item) => {
            const expected = (item.value / totalValue) * 100;
            expect(Math.abs(item.percentage - expected)).toBeLessThanOrEqual(
                tolerance,
            );
        });
    }

    validateLiveOk(mapped: MappedDtrLoadUnbalance): void {
        this.validateSuccess(mapped.success);
        this.validateItemShape(mapped);
        this.validateExpectedLabels(mapped);
        this.validateUniqueLabels(mapped);
        this.validatePercentageTotal(mapped);
        this.validatePercentageConsistency(mapped);
    }

    /** Live fleet: zeros are valid; non-zero fleets must keep bucket math consistent. */
    validateLiveFleetDistribution(mapped: MappedDtrLoadUnbalance): void {
        this.validateLiveOk(mapped);
        const totalValue = mapped.items.reduce(
            (sum, item) => sum + item.value,
            0,
        );
        if (totalValue > 0) {
            expect(mapped.items.some((item) => item.value > 0)).toBeTruthy();
            this.validatePercentageTotal(mapped, 0.5);
            this.validatePercentageConsistency(mapped, 0.5);
        }
    }

    validateAllZeroContract(mapped: MappedDtrLoadUnbalance): void {
        this.validateLiveOk(mapped);
        mapped.items.forEach((item) => {
            expect(item.value).toBe(0);
            expect(item.percentage).toBe(0);
        });
    }

    validateMixedContract(mapped: MappedDtrLoadUnbalance): void {
        this.validateLiveOk(mapped);
        expect(mapped.items[0]?.value).toBe(10);
        expect(mapped.items[1]?.value).toBe(30);
        expect(mapped.items[2]?.value).toBe(60);
    }

    validateAllBalancedContract(mapped: MappedDtrLoadUnbalance): void {
        this.validateLiveOk(mapped);
        expect(mapped.items[0]?.value).toBe(0);
        expect(mapped.items[1]?.value).toBe(0);
        expect(mapped.items[2]?.value).toBe(100);
        expect(mapped.items[2]?.percentage).toBe(100);
    }

    validateAllSevereContract(mapped: MappedDtrLoadUnbalance): void {
        this.validateLiveOk(mapped);
        expect(mapped.items[0]?.value).toBe(50);
        expect(mapped.items[0]?.percentage).toBe(100);
        expect(mapped.items[1]?.value).toBe(0);
        expect(mapped.items[2]?.value).toBe(0);
    }

    validateAuthError(
        responseBody: DtrLoadUnbalanceErrorResponse,
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

    validateUnauthorizedError(responseBody: DtrLoadUnbalanceErrorResponse): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrLoadUnbalanceUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrLoadUnbalanceErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrLoadUnbalanceAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrLoadUnbalance,
        scenario: DtrLoadUnbalanceScenario,
    ): void {
        switch (scenario) {
            case "contract_all_zero":
                this.validateAllZeroContract(mapped);
                break;
            case "contract_mixed_distribution":
                this.validateMixedContract(mapped);
                break;
            case "contract_all_balanced":
                this.validateAllBalancedContract(mapped);
                break;
            case "contract_all_severe":
                this.validateAllSevereContract(mapped);
                break;
            case "contract_percentage_consistency":
                this.validateLiveOk(mapped);
                break;
            case "dev_live_primary":
            case "dev_ignore_unknown_query":
                this.validateLiveFleetDistribution(mapped);
                break;
            default:
                break;
        }
    }
}
