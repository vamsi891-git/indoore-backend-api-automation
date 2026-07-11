import { expect } from "@playwright/test";
import {
    dtrCommunicationLabelPatterns,
    dtrCommunicationPeriodPointCounts,
} from "../Mapper/dtrcommunication.mapper";
import type {
    DtrCommunicationErrorResponse,
    DtrCommunicationPeriod,
    DtrCommunicationResponse,
    DtrCommunicationScenario,
    MappedDtrCommunication,
} from "../Mapper/dtrcommunication.mapper";

const PERIODS = Object.keys(dtrCommunicationPeriodPointCounts);

export class DtrCommunicationValidator {
    validateInvalidPeriodError(
        responseBody: DtrCommunicationErrorResponse,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(/period/i);
    }

    validateResponseEnvelope(response: DtrCommunicationResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validatePeriod(
        data: MappedDtrCommunication,
        expected?: DtrCommunicationPeriod,
    ): void {
        expect(PERIODS).toContain(data.period);
        if (expected) {
            expect(data.period).toBe(expected);
        }
    }

    validatePointCount(data: MappedDtrCommunication): void {
        const expected = dtrCommunicationPeriodPointCounts[data.period];
        expect(data.points.length).toBe(expected);
    }

    validateLabelPatterns(data: MappedDtrCommunication): void {
        const pattern = dtrCommunicationLabelPatterns[data.period];
        data.points.forEach((point) => {
            expect(pattern.test(point.label.trim())).toBeTruthy();
        });
    }

    validatePoints(data: MappedDtrCommunication): void {
        data.points.forEach((point) => {
            expect(point.label).toBeTruthy();
            expect(point.communicating).toBeGreaterThanOrEqual(0);
            expect(point.nonCommunicating).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(point.communicating)).toBeTruthy();
            expect(Number.isInteger(point.nonCommunicating)).toBeTruthy();
        });
    }

    validateUniqueLabels(data: MappedDtrCommunication): void {
        const labels = data.points.map((point) => point.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    validateFleetTotals(data: MappedDtrCommunication): void {
        data.points.forEach((point) => {
            expect(
                point.communicating + point.nonCommunicating,
            ).toBeGreaterThanOrEqual(0);
        });
    }

    validateLiveOk(
        mapped: MappedDtrCommunication,
        expectedPeriod?: DtrCommunicationPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, expectedPeriod);
        this.validatePointCount(mapped);
        this.validateLabelPatterns(mapped);
        this.validatePoints(mapped);
        this.validateUniqueLabels(mapped);
        this.validateFleetTotals(mapped);
    }

    validateNullPeriodContract(
        mapped: MappedDtrCommunication,
        period: DtrCommunicationPeriod,
    ): void {
        this.validateContractPoints(mapped, period);
        this.validatePointCount(mapped);
        mapped.points.forEach((point) => {
            expect(point.communicating).toBe(0);
            expect(point.nonCommunicating).toBe(0);
        });
    }

    validateNullDailyContract(mapped: MappedDtrCommunication): void {
        this.validateNullPeriodContract(mapped, "daily");
    }

    validatePopulatedContract(mapped: MappedDtrCommunication): void {
        this.validatePoints(mapped);
        expect(mapped.points[0].communicating).toBe(1200);
        expect(mapped.points[1].nonCommunicating).toBe(105);
    }

    validateContractPoints(
        mapped: MappedDtrCommunication,
        period: DtrCommunicationPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, period);
        this.validatePointStructure(mapped.points);
        this.validateLabelPatterns(mapped);
        this.validatePoints(mapped);
    }

    validatePointStructure(points: MappedDtrCommunication["points"]): void {
        points.forEach((point) => {
            expect(Object.keys(point).sort()).toEqual(
                ["communicating", "label", "nonCommunicating"].sort(),
            );
        });
    }

    validateScenario(
        mapped: MappedDtrCommunication,
        scenario: DtrCommunicationScenario,
        expectedPeriod?: DtrCommunicationPeriod,
    ): void {
        switch (scenario) {
            case "contract_null_hourly":
                this.validateNullPeriodContract(mapped, "hourly");
                break;
            case "contract_null_daily":
                this.validateNullDailyContract(mapped);
                break;
            case "contract_null_weekly":
                this.validateNullPeriodContract(mapped, "weekly");
                break;
            case "contract_null_monthly":
                this.validateNullPeriodContract(mapped, "monthly");
                break;
            case "contract_null_yearly":
                this.validateNullPeriodContract(mapped, "yearly");
                break;
            case "contract_populated_daily":
                this.validatePopulatedContract(mapped);
                break;
            case "dev_period_hourly":
            case "dev_period_daily":
            case "dev_period_weekly":
            case "dev_period_monthly":
            case "dev_period_yearly":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped, expectedPeriod);
                break;
            default:
                break;
        }
    }
}
