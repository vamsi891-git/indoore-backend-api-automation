import { expect } from "@playwright/test";
import { DtrSummaryModel } from "../Mapper/dtrsummary.mapper";

export class DtrSummaryValidator {

    validatePeriod(data: DtrSummaryModel) {

        expect(
            ["hourly", "daily", "weekly", "monthly", "yearly"]
        ).toContain(data.period);
    }

    validateCounts(data: DtrSummaryModel) {

        expect(data.totalDtrs.count)
            .toBeGreaterThanOrEqual(0);

        expect(data.dtrsOn.count)
            .toBeGreaterThanOrEqual(0);

        expect(data.dtrsOff.count)
            .toBeGreaterThanOrEqual(0);

        expect(data.activeAlerts.count)
            .toBeGreaterThanOrEqual(0);
    }

    validateLabels(data: DtrSummaryModel) {

        expect(data.totalDtrs.label)
            .toBeTruthy();

        expect(data.dtrsOn.label)
            .toBeTruthy();

        expect(data.dtrsOff.label)
            .toBeTruthy();

        expect(data.activeAlerts.label)
            .toBeTruthy();
    }

    validateTrendLengths(data: DtrSummaryModel) {

        let expectedLength = 0;

        switch (data.period) {

            case "hourly":
                expectedLength = 24;
                break;

            case "daily":
                expectedLength = 30;
                break;

            case "weekly":
                expectedLength = 8;
                break;

            case "monthly":
                expectedLength = 24;
                break;

            case "yearly":
                expectedLength = 15;
                break;
        }

        expect(data.totalDtrs.trends.length)
            .toBe(expectedLength);

        expect(data.dtrsOn.trends.length)
            .toBe(expectedLength);

        expect(data.dtrsOff.trends.length)
            .toBe(expectedLength);

        expect(data.activeAlerts.trends.length)
            .toBe(expectedLength);
    }

    validateOnOffLogic(data: DtrSummaryModel) {

        expect(data.dtrsOn.count)
            .toBeLessThanOrEqual(data.totalDtrs.count);

        expect(data.dtrsOff.count)
            .toBeLessThanOrEqual(data.totalDtrs.count);

        expect(
            data.dtrsOn.count +
            data.dtrsOff.count
        ).toBeLessThanOrEqual(
            data.totalDtrs.count
        );
    }

    validateTrendValues(data: DtrSummaryModel) {

        [
            data.totalDtrs,
            data.dtrsOn,
            data.dtrsOff,
            data.activeAlerts
        ].forEach(metric => {

            metric.trends.forEach(value => {

                expect(value)
                    .toBeGreaterThanOrEqual(0);
            });
        });
    }

    validateTrendDataTypes(data: DtrSummaryModel) {

        [
            data.totalDtrs,
            data.dtrsOn,
            data.dtrsOff,
            data.activeAlerts
        ].forEach(metric => {

            metric.trends.forEach(value => {

                expect(typeof value)
                    .toBe("number");
            });
        });
    }

    validateOffScenario(data: DtrSummaryModel) {

        if (
            data.dtrsOff.count ===
            data.totalDtrs.count
        ) {

            expect(data.dtrsOn.count)
                .toBe(0);
        }
    }

    validateOnScenario(data: DtrSummaryModel) {

        if (
            data.dtrsOn.count ===
            data.totalDtrs.count
        ) {

            expect(data.dtrsOff.count)
                .toBe(0);
        }
    }

    validateAlertScenario(data: DtrSummaryModel) {

        expect(data.activeAlerts.count)
            .toBeLessThanOrEqual(
                data.totalDtrs.count
            );
    }

    validateLatestTrend(data: DtrSummaryModel) {

        expect(
            data.totalDtrs.trends.at(-1)
        ).toBeDefined();

        expect(
            data.dtrsOn.trends.at(-1)
        ).toBeDefined();

        expect(
            data.dtrsOff.trends.at(-1)
        ).toBeDefined();

        expect(
            data.activeAlerts.trends.at(-1)
        ).toBeDefined();
    }
}