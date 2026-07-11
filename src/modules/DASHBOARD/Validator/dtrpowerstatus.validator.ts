import { expect } from "@playwright/test";
import {
    dtrPowerStatusLabelPatterns,
    dtrPowerStatusPeriodPointCounts,
} from "../Mapper/dtrpowerstatus.mapper";
import type {
    DtrPowerStatusErrorResponse,
    DtrPowerStatusPeriod,
    DtrPowerStatusResponse,
    DtrPowerStatusScenario,
    MappedDtrPowerStatus,
} from "../Mapper/dtrpowerstatus.mapper";

const PERIODS = Object.keys(dtrPowerStatusPeriodPointCounts);

export class DtrPowerStatusValidator {
    validateInvalidPeriodError(
        responseBody: DtrPowerStatusErrorResponse,
    ): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(/period/i);
    }

    validateResponseEnvelope(response: DtrPowerStatusResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validatePeriod(
        data: MappedDtrPowerStatus,
        expected?: DtrPowerStatusPeriod,
    ): void {
        expect(PERIODS).toContain(data.period);
        if (expected) {
            expect(data.period).toBe(expected);
        }
    }

    validatePointCount(data: MappedDtrPowerStatus): void {
        const expected = dtrPowerStatusPeriodPointCounts[data.period];
        expect(data.points.length).toBe(expected);
        expect(data.points.length).toBeGreaterThan(0);
    }

    validateLabelPatterns(data: MappedDtrPowerStatus): void {
        const pattern = dtrPowerStatusLabelPatterns[data.period];
        data.points.forEach((point) => {
            expect(pattern.test(point.label.trim())).toBeTruthy();
        });
    }

    validateUniqueLabels(data: MappedDtrPowerStatus): void {
        const labels = data.points.map((point) => point.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    validatePoints(data: MappedDtrPowerStatus): void {
        data.points.forEach((point) => {
            expect(point.label).toBeTruthy();
            expect(point.dtrsOn).toBeGreaterThanOrEqual(0);
            expect(point.dtrsOff).toBeGreaterThanOrEqual(0);
            expect(point.onPercentage).toBeGreaterThanOrEqual(0);
            expect(point.onPercentage).toBeLessThanOrEqual(100);
            expect(point.offPercentage).toBeGreaterThanOrEqual(0);
            expect(point.offPercentage).toBeLessThanOrEqual(100);
            expect(Number.isInteger(point.dtrsOn)).toBeTruthy();
            expect(Number.isInteger(point.dtrsOff)).toBeTruthy();
        });
    }

    validatePercentageMath(data: MappedDtrPowerStatus): void {
        data.points.forEach((point) => {
            const total = point.dtrsOn + point.dtrsOff;
            if (total <= 0) {
                return;
            }
            const expectedOn = Math.round((point.dtrsOn / total) * 1000) / 10;
            const expectedOff = Math.round((point.dtrsOff / total) * 1000) / 10;
            expect(Math.abs(point.onPercentage - expectedOn)).toBeLessThanOrEqual(
                0.6,
            );
            expect(Math.abs(point.offPercentage - expectedOff)).toBeLessThanOrEqual(
                0.6,
            );
        });
    }

    validatePercentageTotal(data: MappedDtrPowerStatus): void {
        data.points.forEach((point) => {
            const total = point.dtrsOn + point.dtrsOff;
            if (total <= 0) {
                expect(point.onPercentage + point.offPercentage).toBe(0);
                return;
            }
            expect(
                Math.abs(point.onPercentage + point.offPercentage - 100),
            ).toBeLessThanOrEqual(1);
        });
    }

    validateDataConsistency(data: MappedDtrPowerStatus): void {
        data.points.forEach((point) => {
            if (point.onPercentage === 100) {
                expect(point.dtrsOff).toBe(0);
            }
            if (point.offPercentage === 100) {
                expect(point.dtrsOn).toBe(0);
            }
        });
    }

    validatePointStructure(points: MappedDtrPowerStatus["points"]): void {
        points.forEach((point) => {
            expect(Object.keys(point).sort()).toEqual(
                [
                    "dtrsOff",
                    "dtrsOn",
                    "label",
                    "offPercentage",
                    "onPercentage",
                ].sort(),
            );
        });
    }

    validateLiveOk(
        mapped: MappedDtrPowerStatus,
        expectedPeriod?: DtrPowerStatusPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, expectedPeriod);
        this.validatePointCount(mapped);
        this.validateLabelPatterns(mapped);
        this.validateUniqueLabels(mapped);
        this.validatePoints(mapped);
        this.validatePercentageMath(mapped);
        this.validatePercentageTotal(mapped);
        this.validateDataConsistency(mapped);
        expect(mapped.points.at(-1)?.label).toBeTruthy();
    }

    validateNullPeriodContract(
        mapped: MappedDtrPowerStatus,
        period: DtrPowerStatusPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, period);
        this.validatePointStructure(mapped.points);
        this.validatePointCount(mapped);
        this.validateLabelPatterns(mapped);
        mapped.points.forEach((point) => {
            expect(point.dtrsOn).toBe(0);
            expect(point.dtrsOff).toBe(0);
            expect(point.onPercentage).toBe(0);
            expect(point.offPercentage).toBe(0);
        });
    }

    validateLiveMonthlyContract(mapped: MappedDtrPowerStatus): void {
        this.validateLiveOk(mapped, "monthly");
        expect(mapped.points[0].dtrsOn).toBe(1086);
        expect(mapped.points[4].offPercentage).toBe(43.5);
        const jul = mapped.points.at(-1);
        expect(jul?.dtrsOff).toBe(1285);
        expect(jul?.offPercentage).toBe(100);
    }

    validateLiveYearlyContract(mapped: MappedDtrPowerStatus): void {
        this.validateLiveOk(mapped, "yearly");
        const y2025 = mapped.points.find((p) => p.label === "2025");
        const y2026 = mapped.points.find((p) => p.label === "2026");
        expect(y2025?.dtrsOn).toBe(431);
        expect(y2025?.offPercentage).toBe(66.5);
        expect(y2026?.dtrsOff).toBe(1285);
        expect(y2026?.offPercentage).toBe(100);
    }

    validateMixedContract(mapped: MappedDtrPowerStatus): void {
        this.validatePoints(mapped);
        this.validatePercentageMath(mapped);
        expect(mapped.points[0].onPercentage).toBe(62);
        expect(mapped.points[1].offPercentage).toBe(100);
        expect(mapped.points[1].dtrsOn).toBe(0);
    }

    validateScenario(
        mapped: MappedDtrPowerStatus,
        scenario: DtrPowerStatusScenario,
        expectedPeriod?: DtrPowerStatusPeriod,
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
            case "contract_live_monthly":
                this.validateLiveMonthlyContract(mapped);
                break;
            case "contract_live_yearly":
                this.validateLiveYearlyContract(mapped);
                break;
            case "contract_on_off_mixed":
                this.validateMixedContract(mapped);
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
