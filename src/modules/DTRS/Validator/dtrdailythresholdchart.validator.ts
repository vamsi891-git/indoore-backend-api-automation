import { expect } from "@playwright/test";
import {
    dtrDailyThresholdContractPfMeta,
    dtrDailyThresholdContractReactiveMeta,
    dtrDailyThresholdEnergyFields,
    dtrDailyThresholdPeriodPointCounts,
    dtrDailyThresholdPeriods,
    dtrDailyThresholdPointFields,
} from "../Data/dtrdailythresholdchart.data";
import type {
    DtrDailyThresholdChartErrorResponse,
    DtrDailyThresholdChartResponse,
    DtrDailyThresholdChartScenario,
    DtrDailyThresholdPeriod,
    MappedDtrDailyThresholdChart,
    ThresholdChartPoint,
} from "../Mapper/dtrdailythresholdchart.mapper";
import {
    derivePowerFactorFromEnergy,
    deriveReactiveEnergyKvarh,
} from "../utils/dtr-backend.util";

const LABEL_PATTERNS: Record<DtrDailyThresholdPeriod, RegExp> = {
    hourly: /^\d{2}:\d{2}$/,
    daily: /^\d{1,2}\s+\w{3}$/,
    weekly: /^W\d+$/,
    monthly: /^\w+\s+\d{4}$/,
    yearly: /^\d{4}$/,
};

export class DtrDailyThresholdChartValidator {
    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validateNotFoundError(
        responseBody: DtrDailyThresholdChartErrorResponse,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
        expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
    }

    validateBlankCodeError(
        responseBody: DtrDailyThresholdChartErrorResponse,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(
            /dtr|network|code/i,
        );
    }

    validateInvalidPeriodError(
        responseBody: DtrDailyThresholdChartErrorResponse,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(/period/i);
    }

    validateResponseEnvelope(response: DtrDailyThresholdChartResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateFields(data: MappedDtrDailyThresholdChart): void {
        expect(data).toHaveProperty("period");
        expect(data).toHaveProperty("points");
        expect(Array.isArray(data.points)).toBeTruthy();
    }

    validatePeriod(
        period: DtrDailyThresholdPeriod,
        expected?: DtrDailyThresholdPeriod,
    ): void {
        expect(dtrDailyThresholdPeriods).toContain(period);
        if (expected) {
            expect(period).toBe(expected);
        }
    }

    validatePointsLength(
        period: DtrDailyThresholdPeriod,
        points: ThresholdChartPoint[],
    ): void {
        expect(points.length).toBe(dtrDailyThresholdPeriodPointCounts[period]);
    }

    validatePointStructure(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            expect(Object.keys(point).sort()).toEqual(
                [...dtrDailyThresholdPointFields].sort(),
            );
            expect(typeof point.label).toBe("string");
            expect(point.label.trim().length).toBeGreaterThan(0);
        });
    }

    validateLabelPatterns(
        period: DtrDailyThresholdPeriod,
        points: ThresholdChartPoint[],
    ): void {
        const pattern = LABEL_PATTERNS[period];
        points.forEach((point) => {
            expect(pattern.test(point.label.trim())).toBeTruthy();
        });
    }

    validateNumericOrNull(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            for (const field of dtrDailyThresholdEnergyFields) {
                const value = point[field];
                expect(value === null || typeof value === "number").toBeTruthy();
            }
        });
    }

    validateFiniteNumbers(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            for (const field of dtrDailyThresholdEnergyFields) {
                const value = point[field];
                if (typeof value === "number") {
                    expect(Number.isFinite(value)).toBeTruthy();
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            }
        });
    }

    validatePowerFactorRange(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            if (point.powerFactor !== null) {
                expect(Math.abs(point.powerFactor)).toBeLessThanOrEqual(1);
            }
        });
    }

    validateNonNegativeEnergy(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            const fields = [
                "activeEnergyKwh",
                "reactiveEnergyKvarh",
                "apparentEnergyKvah",
            ] as const;
            for (const field of fields) {
                const value = point[field];
                if (value !== null) {
                    expect(value).toBeGreaterThanOrEqual(0);
                }
            }
        });
    }

    validateEnergyTriangle(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            if (
                point.activeEnergyKwh !== null &&
                point.apparentEnergyKvah !== null
            ) {
                expect(point.apparentEnergyKvah + 0.001).toBeGreaterThanOrEqual(
                    point.activeEnergyKwh,
                );
            }
        });
    }

    validateReactiveDerivation(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            const derived = deriveReactiveEnergyKvarh(
                point.activeEnergyKwh,
                point.apparentEnergyKvah,
            );
            if (derived == null) {
                expect(point.reactiveEnergyKvarh).toBeNull();
                return;
            }
            if (point.reactiveEnergyKvarh === derived) {
                return;
            }

            // Archive/meter-provided reactive takes precedence over derived estimate.
            if (
                point.reactiveEnergyKvarh !== null &&
                point.activeEnergyKwh !== null &&
                point.apparentEnergyKvah !== null &&
                point.apparentEnergyKvah >= point.activeEnergyKwh
            ) {
                expect(point.reactiveEnergyKvarh).toBeGreaterThanOrEqual(0);
                expect(point.reactiveEnergyKvarh).toBeLessThanOrEqual(derived + 0.1);
                return;
            }

            expect(point.reactiveEnergyKvarh).toBe(derived);
        });
    }

    validatePowerFactorDerivation(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            if (point.powerFactor == null) return;
            const fromEnergy = derivePowerFactorFromEnergy(
                point.activeEnergyKwh,
                point.apparentEnergyKvah,
            );
            if (fromEnergy == null) return;
            expect(point.powerFactor).toBe(fromEnergy);
        });
    }

    validateUniqueLabels(points: ThresholdChartPoint[]): void {
        const labels = points.map((p) => p.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    validateAllNullPoints(points: ThresholdChartPoint[]): void {
        points.forEach((point) => {
            expect(point.activeEnergyKwh).toBeNull();
            expect(point.reactiveEnergyKvarh).toBeNull();
            expect(point.apparentEnergyKvah).toBeNull();
            expect(point.powerFactor).toBeNull();
        });
    }

    validateLiveOk(
        mapped: MappedDtrDailyThresholdChart,
        expectedPeriod: DtrDailyThresholdPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validateFields(mapped);
        this.validatePeriod(mapped.period, expectedPeriod);
        this.validatePointsLength(mapped.period, mapped.points);
        this.validateContractPoints(mapped.period, mapped.points);
        this.validateUniqueLabels(mapped.points);
    }

    /** Partial contract fixtures — structure and derivation rules without full bucket counts. */
    validateContractPoints(
        period: DtrDailyThresholdPeriod,
        points: ThresholdChartPoint[],
    ): void {
        this.validatePointStructure(points);
        this.validateLabelPatterns(period, points);
        this.validateNumericOrNull(points);
        this.validateFiniteNumbers(points);
        this.validatePowerFactorRange(points);
        this.validateNonNegativeEnergy(points);
        this.validateEnergyTriangle(points);
        this.validateReactiveDerivation(points);
        this.validatePowerFactorDerivation(points);
    }

    validateNullHourlyContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateLiveOk(mapped, "hourly");
        this.validateAllNullPoints(mapped.points);
        expect(mapped.points[0].label).toBe("06:00");
        expect(mapped.points[mapped.points.length - 1].label).toBe("17:00");
    }

    validateNullDailyContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateLiveOk(mapped, "daily");
        this.validateAllNullPoints(mapped.points);
    }

    validateNullWeeklyContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateLiveOk(mapped, "weekly");
        this.validateAllNullPoints(mapped.points);
        expect(mapped.points.map((p) => p.label)).toEqual([
            "W1",
            "W2",
            "W3",
            "W4",
            "W5",
            "W6",
            "W7",
            "W8",
        ]);
    }

    validateNullMonthlyContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateLiveOk(mapped, "monthly");
        this.validateAllNullPoints(mapped.points);
        expect(mapped.points[0].label).toBe("Aug 2025");
    }

    validateNullYearlyContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateLiveOk(mapped, "yearly");
        this.validateAllNullPoints(mapped.points);
        expect(mapped.points[0].label).toBe("2015");
        expect(mapped.points[mapped.points.length - 1].label).toBe("2026");
    }

    validatePopulatedContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateSuccess(mapped.success);
        this.validateFields(mapped);
        this.validatePeriod(mapped.period, "daily");
        this.validateContractPoints(mapped.period, mapped.points);
        expect(mapped.points[0].activeEnergyKwh).toBe(15.5);
        expect(mapped.points[0].powerFactor).toBe(0.89);
        expect(mapped.points[0].reactiveEnergyKvarh).toBe(8.2);
        expect(mapped.points[1].reactiveEnergyKvarh).toBe(15);
    }

    validateReactiveContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateSuccess(mapped.success);
        this.validateFields(mapped);
        this.validatePeriod(mapped.period, "hourly");
        this.validateContractPoints(mapped.period, mapped.points);
        const meta = dtrDailyThresholdContractReactiveMeta;
        expect(mapped.points[0].reactiveEnergyKvarh).toBe(
            meta.expectedReactiveKvarh,
        );
        expect(mapped.points[0].reactiveEnergyKvarh).toBe(
            deriveReactiveEnergyKvarh(
                meta.activeEnergyKwh,
                meta.apparentEnergyKvah,
            ),
        );
    }

    validatePfContract(mapped: MappedDtrDailyThresholdChart): void {
        this.validateSuccess(mapped.success);
        this.validateFields(mapped);
        this.validatePeriod(mapped.period, "weekly");
        this.validateContractPoints(mapped.period, mapped.points);
        const meta = dtrDailyThresholdContractPfMeta;
        expect(mapped.points[0].powerFactor).toBe(meta.expectedPowerFactor);
        expect(mapped.points[0].powerFactor).toBe(
            derivePowerFactorFromEnergy(
                meta.activeEnergyKwh,
                meta.apparentEnergyKvah,
            ),
        );
    }

    validateScenario(
        mapped: MappedDtrDailyThresholdChart,
        scenario: DtrDailyThresholdChartScenario,
        expectedPeriod?: DtrDailyThresholdPeriod,
    ): void {
        switch (scenario) {
            case "contract_null_hourly":
                this.validateNullHourlyContract(mapped);
                break;
            case "contract_null_daily":
                this.validateNullDailyContract(mapped);
                break;
            case "contract_null_weekly":
                this.validateNullWeeklyContract(mapped);
                break;
            case "contract_null_monthly":
                this.validateNullMonthlyContract(mapped);
                break;
            case "contract_null_yearly":
                this.validateNullYearlyContract(mapped);
                break;
            case "contract_populated_energy":
                this.validatePopulatedContract(mapped);
                break;
            case "contract_reactive_derivation":
                this.validateReactiveContract(mapped);
                break;
            case "contract_pf_from_energy":
                this.validatePfContract(mapped);
                break;
            case "ddt_by_code_primary_hourly":
            case "ddt_by_code_primary_daily":
            case "ddt_by_code_primary_weekly":
            case "ddt_by_code_primary_monthly":
            case "ddt_by_code_primary_yearly":
            case "ddt_by_code_alt":
            case "ddt_ignore_unknown_query":
                this.validateLiveOk(mapped, expectedPeriod!);
                break;
            default:
                break;
        }
    }
}
