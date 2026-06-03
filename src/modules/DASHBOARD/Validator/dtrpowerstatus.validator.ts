import { expect } from "@playwright/test";
import { DtrPowerStatusModel } from "../Mapper/dtrpowerstatus.mapper";

export class DtrPowerStatusValidator {

    validatePeriod(data: DtrPowerStatusModel) {
        expect(data.period).toBeTruthy();
        expect(["daily", "monthly"]).toContain(data.period);
    }
    validatePoints(data: DtrPowerStatusModel) {

        data.points.forEach(point => {

            expect(point.label).toBeTruthy();

            expect(point.dtrsOn)
                .toBeGreaterThanOrEqual(0);

            expect(point.dtrsOff)
                .toBeGreaterThanOrEqual(0);

            expect(point.onPercentage)
                .toBeGreaterThanOrEqual(0);

            expect(point.onPercentage)
                .toBeLessThanOrEqual(100);

            expect(point.offPercentage)
                .toBeGreaterThanOrEqual(0);

            expect(point.offPercentage)
                .toBeLessThanOrEqual(100);
        });
    }

    validatePercentageMath(data: DtrPowerStatusModel) {

        data.points.forEach(point => {

            const total =
                point.dtrsOn + point.dtrsOff;

            if (total > 0) {

                const expectedOn =
                    Number(
                        ((point.dtrsOn / total) * 100)
                            .toFixed(0)
                    );

                const expectedOff =
                    Number(
                        ((point.dtrsOff / total) * 100)
                            .toFixed(0)
                    );

                expect(
                    Math.abs(
                        point.onPercentage - expectedOn
                    )
                ).toBeLessThanOrEqual(1);

                expect(
                    Math.abs(
                        point.offPercentage - expectedOff
                    )
                ).toBeLessThanOrEqual(1);
            }
        });
    }

    validatePercentageTotal(data: DtrPowerStatusModel) {

        data.points.forEach(point => {

            expect(
                point.onPercentage +
                point.offPercentage
            ).toBeLessThanOrEqual(101);
        });
    }

    validateLatestPoint(data: DtrPowerStatusModel) {

        const latest =
            data.points[data.points.length - 1];

        expect(latest).toBeDefined();
        expect(latest.label).toBeTruthy();
    }

    validateNoNegativeValues(data: DtrPowerStatusModel) {

        data.points.forEach(point => {

            expect(point.dtrsOn)
                .toBeGreaterThanOrEqual(0);

            expect(point.dtrsOff)
                .toBeGreaterThanOrEqual(0);
        });
    }
    validatePointCount(data: DtrPowerStatusModel, expected: number) {
        expect(data.points.length).toBe(expected);
        expect(data.points.length).toBeGreaterThan(0);
    }

    validateDataConsistency(data: DtrPowerStatusModel) {

        data.points.forEach(point => {

            if (
                point.onPercentage === 100
            ) {
                expect(point.dtrsOff)
                    .toBe(0);
            }

            if (
                point.offPercentage === 100
            ) {
                expect(point.dtrsOn)
                    .toBe(0);
            }
        });
    }
}