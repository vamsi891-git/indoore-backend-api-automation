import { expect } from "@playwright/test";
import {
    dtrVoltageUnbalanceAccessTokenInvalidMessage,
    dtrVoltageUnbalanceSuccessMessage,
    dtrVoltageUnbalanceUnauthorizedMessage,
} from "../Data/dtrvoltageunbalance.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
    DTR_VOLTAGE_UNBALANCE_LABELS,
    type DtrVoltageUnbalanceErrorResponse,
    type DtrVoltageUnbalanceResponse,
    type DtrVoltageUnbalanceScenario,
    type MappedDtrVoltageUnbalance,
} from "../Mapper/dtrvoltageunbalance.mapper";

export class DtrVoltageUnbalanceValidator {
    validateResponseEnvelope(response: DtrVoltageUnbalanceResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBeTruthy();
        if (response.message != null) {
            expect(response.message).toBe(dtrVoltageUnbalanceSuccessMessage);
        }
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validateItemShape(mapped: MappedDtrVoltageUnbalance): void {
        expect(mapped.items.length).toBe(DTR_VOLTAGE_UNBALANCE_LABELS.length);

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

    validateExpectedLabels(mapped: MappedDtrVoltageUnbalance): void {
        const labels = mapped.items.map((item) => item.label);
        expect(labels).toEqual([...DTR_VOLTAGE_UNBALANCE_LABELS]);
    }

    validateUniqueLabels(mapped: MappedDtrVoltageUnbalance): void {
        const labels = mapped.items.map((item) => item.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    validatePercentageTotal(
        mapped: MappedDtrVoltageUnbalance,
        tolerance = 1,
    ): void {
        const totalValue = mapped.items.reduce(
            (sum, item) => sum + item.value,
            0,
        );
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
        mapped: MappedDtrVoltageUnbalance,
        tolerance = 1,
    ): void {
        const totalValue = mapped.items.reduce(
            (sum, item) => sum + item.value,
            0,
        );
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

    validateLiveOk(mapped: MappedDtrVoltageUnbalance): void {
        this.validateSuccess(mapped.success);
        this.validateItemShape(mapped);
        this.validateExpectedLabels(mapped);
        this.validateUniqueLabels(mapped);
        this.validatePercentageTotal(mapped);
        this.validatePercentageConsistency(mapped);
    }

    /** Live fleet: zeros are valid; non-zero fleets must keep bucket math consistent. */
    validateLiveFleetDistribution(mapped: MappedDtrVoltageUnbalance): void {
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

    validateAllZeroContract(mapped: MappedDtrVoltageUnbalance): void {
        this.validateLiveOk(mapped);
        mapped.items.forEach((item) => {
            expect(item.value).toBe(0);
            expect(item.percentage).toBe(0);
        });
    }

    validateMixedContract(mapped: MappedDtrVoltageUnbalance): void {
        this.validateLiveOk(mapped);
        expect(mapped.items[0]?.value).toBe(10);
        expect(mapped.items[1]?.value).toBe(30);
        expect(mapped.items[2]?.value).toBe(60);
    }

    validateAllBalancedContract(mapped: MappedDtrVoltageUnbalance): void {
        this.validateLiveOk(mapped);
        expect(mapped.items[0]?.value).toBe(0);
        expect(mapped.items[1]?.value).toBe(0);
        expect(mapped.items[2]?.value).toBe(100);
        expect(mapped.items[2]?.percentage).toBe(100);
    }

    validateAllSevereContract(mapped: MappedDtrVoltageUnbalance): void {
        this.validateLiveOk(mapped);
        expect(mapped.items[0]?.value).toBe(50);
        expect(mapped.items[0]?.percentage).toBe(100);
        expect(mapped.items[1]?.value).toBe(0);
        expect(mapped.items[2]?.value).toBe(0);
    }

    validateAuthError(
        responseBody: DtrVoltageUnbalanceErrorResponse,
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
        responseBody: DtrVoltageUnbalanceErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceUnauthorizedCode,
            dtrVoltageUnbalanceUnauthorizedMessage,
        );
    }

    validateAccessTokenInvalidError(
        responseBody: DtrVoltageUnbalanceErrorResponse,
    ): void {
        this.validateAuthError(
            responseBody,
            dtrUnbalanceAccessTokenInvalidCode,
            dtrVoltageUnbalanceAccessTokenInvalidMessage,
        );
    }

    validateScenario(
        mapped: MappedDtrVoltageUnbalance,
        scenario: DtrVoltageUnbalanceScenario,
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
