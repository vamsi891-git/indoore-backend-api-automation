import { expect } from "@playwright/test";
import { DtrConsumptionModel } from "../Mapper/dtrconsumption.mapper";

export class DtrConsumptionValidator {

    validatePeriod(data: DtrConsumptionModel) {

        expect(
            ["daily", "weekly", "monthly", "yearly"]
        ).toContain(data.period);
    }

    validatePointCount(data: DtrConsumptionModel) {

        expect(data.points.length)
            .toBeGreaterThan(0);

        if (data.period === "daily") {
            expect(data.points.length).toBe(12);
        }

        if (data.period === "monthly") {
            expect(data.points.length).toBe(24);
        }
    }

    validatePoints(data: DtrConsumptionModel) {

        data.points.forEach(point => {

            expect(point.label).toBeTruthy();

            expect(point.kwh)
                .toBeGreaterThanOrEqual(0);

            expect(point.kvah)
                .toBeGreaterThanOrEqual(0);

            expect(point.kvarh)
                .toBeGreaterThanOrEqual(0);

            expect(Number.isFinite(point.kwh))
                .toBeTruthy();

            expect(Number.isFinite(point.kvah))
                .toBeTruthy();

            expect(Number.isFinite(point.kvarh))
                .toBeTruthy();
        });
    }

    validateUniqueLabels(data: DtrConsumptionModel) {

        const labels = data.points.map(x => x.label);

        const duplicates = labels.filter(
            (label, index) =>
                labels.indexOf(label) !== index
        );

        expect(duplicates.length).toBe(0);
    }

    validateTotals(data: DtrConsumptionModel) {

        const totalKwh = data.points.reduce(
            (sum, x) => sum + x.kwh,
            0
        );

        const totalKvah = data.points.reduce(
            (sum, x) => sum + x.kvah,
            0
        );

        const totalKvarh = data.points.reduce(
            (sum, x) => sum + x.kvarh,
            0
        );

        expect(totalKwh)
            .toBeGreaterThanOrEqual(0);

        expect(totalKvah)
            .toBeGreaterThanOrEqual(0);

        expect(totalKvarh)
            .toBeGreaterThanOrEqual(0);
    }

    validateKvahVsKwh(data: DtrConsumptionModel) {

        data.points.forEach(point => {

            expect(point.kvah)
                .toBeGreaterThanOrEqual(point.kwh);
        });
    }
}