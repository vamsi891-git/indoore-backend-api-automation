import { expect } from "@playwright/test";
import { dtrSummaryPeriodTrendLengths } from "../Mapper/dtrsummary.mapper";
import type {
    DtrSummaryErrorResponse,
    DtrSummaryPeriod,
    DtrSummaryResponse,
    DtrSummaryScenario,
    MappedDtrSummary,
    SummaryMetric,
} from "../Mapper/dtrsummary.mapper";

const PERIODS = Object.keys(dtrSummaryPeriodTrendLengths);

export class DtrSummaryValidator {
    validateInvalidPeriodError(responseBody: DtrSummaryErrorResponse): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error.message.toLowerCase()).toMatch(/period/i);
    }

    validateResponseEnvelope(response: DtrSummaryResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validatePeriod(
        data: MappedDtrSummary,
        expected?: DtrSummaryPeriod,
    ): void {
        expect(PERIODS).toContain(data.period);
        if (expected) {
            expect(data.period).toBe(expected);
        }
    }

    validateCounts(data: MappedDtrSummary): void {
        expect(data.totalDtrs.count).toBeGreaterThanOrEqual(0);
        expect(data.dtrsOn.count).toBeGreaterThanOrEqual(0);
        expect(data.dtrsOff.count).toBeGreaterThanOrEqual(0);
        expect(data.activeAlerts.count).toBeGreaterThanOrEqual(0);
    }

    validateLabels(data: MappedDtrSummary): void {
        expect(data.totalDtrs.label).toBe("Total DTRs");
        expect(data.dtrsOn.label).toBe("DTRs ON");
        expect(data.dtrsOff.label).toBe("DTRs OFF");
        expect(data.activeAlerts.label).toBe("Active Alerts");
    }

    validateTrendLengths(data: MappedDtrSummary): void {
        const expectedLength = dtrSummaryPeriodTrendLengths[data.period];
        const metrics = [
            data.totalDtrs,
            data.dtrsOn,
            data.dtrsOff,
            data.activeAlerts,
        ];
        metrics.forEach((metric) => {
            expect(metric.trends.length).toBe(expectedLength);
        });
    }

    validateOnOffLogic(data: MappedDtrSummary): void {
        expect(data.dtrsOn.count).toBeLessThanOrEqual(data.totalDtrs.count);
        expect(data.dtrsOff.count).toBeLessThanOrEqual(data.totalDtrs.count);
        expect(data.dtrsOn.count + data.dtrsOff.count).toBeLessThanOrEqual(
            data.totalDtrs.count,
        );
    }

    validateTrendValues(metrics: SummaryMetric[]): void {
        metrics.forEach((metric) => {
            metric.trends.forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(typeof value).toBe("number");
            });
        });
    }

    validateOffScenario(data: MappedDtrSummary): void {
        if (data.dtrsOff.count === data.totalDtrs.count) {
            expect(data.dtrsOn.count).toBe(0);
        }
    }

    validateOnScenario(data: MappedDtrSummary): void {
        if (data.dtrsOn.count === data.totalDtrs.count) {
            expect(data.dtrsOff.count).toBe(0);
        }
    }

    validateAlertScenario(data: MappedDtrSummary): void {
        expect(data.activeAlerts.count).toBeLessThanOrEqual(
            data.totalDtrs.count,
        );
    }

    validateLatestTrendMatchesCount(data: MappedDtrSummary): void {
        expect(data.totalDtrs.trends.at(-1)).toBe(data.totalDtrs.count);
        expect(data.dtrsOn.trends.at(-1)).toBe(data.dtrsOn.count);
        expect(data.dtrsOff.trends.at(-1)).toBe(data.dtrsOff.count);
        expect(data.activeAlerts.trends.at(-1)).toBe(data.activeAlerts.count);
    }

    validateLiveOk(
        mapped: MappedDtrSummary,
        expectedPeriod?: DtrSummaryPeriod,
    ): void {
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped, expectedPeriod);
        this.validateCounts(mapped);
        this.validateLabels(mapped);
        this.validateTrendLengths(mapped);
        this.validateOnOffLogic(mapped);
        this.validateTrendValues([
            mapped.totalDtrs,
            mapped.dtrsOn,
            mapped.dtrsOff,
            mapped.activeAlerts,
        ]);
        this.validateOffScenario(mapped);
        this.validateOnScenario(mapped);
        this.validateAlertScenario(mapped);
        this.validateLatestTrendMatchesCount(mapped);
    }

    validateLiveFleetContract(
        mapped: MappedDtrSummary,
        period: DtrSummaryPeriod,
    ): void {
        this.validateLiveOk(mapped, period);
        expect(mapped.totalDtrs.count).toBe(1285);
        expect(mapped.dtrsOn.count).toBe(0);
        expect(mapped.dtrsOff.count).toBe(1285);
        expect(mapped.dtrsOff.trends.at(-1)).toBe(1285);
    }

    validateAllOffContract(mapped: MappedDtrSummary): void {
        this.validateLiveOk(mapped, "daily");
        expect(mapped.dtrsOn.count).toBe(0);
        expect(mapped.dtrsOff.count).toBe(mapped.totalDtrs.count);
    }

    validateScenario(
        mapped: MappedDtrSummary,
        scenario: DtrSummaryScenario,
        expectedPeriod?: DtrSummaryPeriod,
    ): void {
        switch (scenario) {
            case "contract_live_hourly":
                this.validateLiveFleetContract(mapped, "hourly");
                break;
            case "contract_live_daily":
                this.validateLiveFleetContract(mapped, "daily");
                break;
            case "contract_live_weekly":
                this.validateLiveFleetContract(mapped, "weekly");
                break;
            case "contract_live_monthly":
                this.validateLiveFleetContract(mapped, "monthly");
                break;
            case "contract_live_yearly":
                this.validateLiveFleetContract(mapped, "yearly");
                break;
            case "contract_all_off_scenario":
                this.validateAllOffContract(mapped);
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
