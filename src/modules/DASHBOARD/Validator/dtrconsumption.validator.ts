import { expect } from "@playwright/test";
import {
    dtrConsumptionLabelPatterns,
    dtrConsumptionPeriodPointCounts,
} from "../Mapper/dtrconsumption.mapper";
import type {
    DtrConsumptionErrorResponse,
    DtrConsumptionPeriod,
    DtrConsumptionResponse,
    DtrConsumptionScenario,
    MappedDtrConsumption,
} from "../Mapper/dtrconsumption.mapper";

const PERIODS = Object.keys(dtrConsumptionPeriodPointCounts);
const SUCCESS_MESSAGE = "DTR consumption data fetched successfully.";

export class DtrConsumptionValidator {
    validateInvalidPeriodError(
        responseBody: DtrConsumptionErrorResponse,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(/period/i);
    }

    validateResponseEnvelope(response: DtrConsumptionResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(SUCCESS_MESSAGE);
        }
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validatePeriod(
        data: MappedDtrConsumption,
        expected?: DtrConsumptionPeriod,
    ): void {
        expect(PERIODS).toContain(data.period);
        if (expected) {
            expect(data.period).toBe(expected);
        }
    }

    validatePointCount(data: MappedDtrConsumption): void {
        const expected = dtrConsumptionPeriodPointCounts[data.period];
        expect(data.points.length).toBe(expected);
        expect(data.points.length).toBeGreaterThan(0);
    }

    validateLabelPatterns(data: MappedDtrConsumption): void {
        const pattern = dtrConsumptionLabelPatterns[data.period];
        data.points.forEach((point) => {
            expect(pattern.test(point.label.trim())).toBeTruthy();
        });
    }

    validateUniqueLabels(data: MappedDtrConsumption): void {
        const labels = data.points.map((point) => point.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    validatePoints(data: MappedDtrConsumption): void {
        data.points.forEach((point) => {
            expect(point.label).toBeTruthy();
            expect(point.kwh).toBeGreaterThanOrEqual(0);
            expect(point.kvah).toBeGreaterThanOrEqual(0);
            expect(point.kvarh).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(point.kwh)).toBeTruthy();
            expect(Number.isFinite(point.kvah)).toBeTruthy();
            expect(Number.isFinite(point.kvarh)).toBeTruthy();
        });
    }

    validatePointStructure(points: MappedDtrConsumption["points"]): void {
        points.forEach((point) => {
            expect(Object.keys(point).sort()).toEqual(
                ["kvarh", "kvah", "kwh", "label"].sort(),
            );
        });
    }

    validateKvahVsKwh(data: MappedDtrConsumption): void {
        data.points.forEach((point) => {
            if (point.kwh > 0 || point.kvah > 0) {
                expect(point.kvah).toBeGreaterThanOrEqual(point.kwh);
            }
        });
    }

    validateLiveOk(
        mapped: MappedDtrConsumption,
        expectedPeriod?: DtrConsumptionPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, expectedPeriod);
        this.validatePointCount(mapped);
        this.validateLabelPatterns(mapped);
        this.validateUniqueLabels(mapped);
        this.validatePoints(mapped);
        this.validateKvahVsKwh(mapped);
        expect(mapped.points.at(-1)?.label).toBeTruthy();
    }

    validateNullPeriodContract(
        mapped: MappedDtrConsumption,
        period: DtrConsumptionPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, period);
        this.validatePointStructure(mapped.points);
        this.validatePointCount(mapped);
        this.validateLabelPatterns(mapped);
        mapped.points.forEach((point) => {
            expect(point.kwh).toBe(0);
            expect(point.kvah).toBe(0);
            expect(point.kvarh).toBe(0);
        });
    }

    validateNullMonthlyContract(mapped: MappedDtrConsumption): void {
        this.validateNullPeriodContract(mapped, "monthly");
        expect(mapped.points[1].label).toBe("Sept 2025");
    }

    validatePopulatedContract(mapped: MappedDtrConsumption): void {
        this.validatePoints(mapped);
        this.validatePointStructure(mapped.points);
        expect(mapped.points[0].kwh).toBe(150.5);
        expect(mapped.points[1].kvarh).toBe(120);
        this.validateKvahVsKwh(mapped);
    }

    validateScenario(
        mapped: MappedDtrConsumption,
        scenario: DtrConsumptionScenario,
        expectedPeriod?: DtrConsumptionPeriod,
    ): void {
        switch (scenario) {
            case "contract_null_hourly":
                this.validateNullPeriodContract(mapped, "hourly");
                break;
            case "contract_null_daily":
                this.validateNullPeriodContract(mapped, "daily");
                break;
            case "contract_null_weekly":
                this.validateNullPeriodContract(mapped, "weekly");
                break;
            case "contract_null_monthly":
                this.validateNullMonthlyContract(mapped);
                break;
            case "contract_null_yearly":
                this.validateNullPeriodContract(mapped, "yearly");
                break;
            case "contract_populated_points":
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
