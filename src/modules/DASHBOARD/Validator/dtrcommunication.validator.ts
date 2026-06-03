import { expect } from "@playwright/test";
import { DtrCommunicationModel } from "../Mapper/dtrcommunication.mapper";

export class DtrCommunicationValidator {

    validatePeriod(data: DtrCommunicationModel) {
        expect(
            ["daily", "weekly", "monthly", "yearly"]
        ).toContain(data.period);
    }

    validatePointCount(data: DtrCommunicationModel) {

        if (data.period === "daily") {
            expect(data.points.length).toBe(30);
        }

        if (data.period === "monthly") {
            expect(data.points.length).toBe(24);
        }

        expect(data.points.length).toBeGreaterThan(0);
    }

    validatePoints(data: DtrCommunicationModel) {

        data.points.forEach(point => {

            expect(point.label).toBeTruthy();

            expect(point.communicatingMeters)
                .toBeGreaterThanOrEqual(0);

            expect(point.nonCommunicatingMeters)
                .toBeGreaterThanOrEqual(0);

            expect(
                Number.isInteger(point.communicatingMeters)
            ).toBeTruthy();

            expect(
                Number.isInteger(point.nonCommunicatingMeters)
            ).toBeTruthy();
        });
    }

    validateUniqueLabels(data: DtrCommunicationModel) {

        const labels = data.points.map(x => x.label);

        const duplicates = labels.filter(
            (label, index) =>
                labels.indexOf(label) !== index
        );

        expect(duplicates.length).toBe(0);
    }

    validateTotals(data: DtrCommunicationModel) {

        const communicatingTotal = data.points.reduce(
            (sum, x) => sum + x.communicatingMeters,
            0
        );

        const nonCommunicatingTotal = data.points.reduce(
            (sum, x) => sum + x.nonCommunicatingMeters,
            0
        );

        expect(communicatingTotal).toBeGreaterThanOrEqual(0);
        expect(nonCommunicatingTotal).toBeGreaterThanOrEqual(0);
    }

    validateCommunicationStatus(data: DtrCommunicationModel) {

        data.points.forEach(point => {

            expect(
                point.communicatingMeters +
                point.nonCommunicatingMeters
            ).toBeGreaterThanOrEqual(0);
        });
    }
}