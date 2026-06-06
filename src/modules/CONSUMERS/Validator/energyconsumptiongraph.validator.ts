import { expect } from "@playwright/test";
import { GraphPoint } from "../Mapper/energyconsumptiongraph.mapper";

export class EnergyConsumptionGraphValidator {
    validateSuccess(data: { success: boolean }) {
        expect(data.success).toBeTruthy();
    }

    validateStructure(data: {
        period?: string;
        points?: unknown[];
    }) {
        expect(data.period).toBeDefined();
        expect(Array.isArray(data.points)).toBeTruthy();
    }

    validatePeriod(data: { period: string }) {
        expect(["daily", "weekly", "monthly", "yearly"]).toContain(
            data.period,
        );
    }

    validatePointsCount(data: { points: unknown[] }) {
        expect(data.points.length).toBeGreaterThan(0);
    }

    validatePointStructure(points: GraphPoint[]) {
        points.forEach((point) => {
            expect(point).toHaveProperty("label");
            expect(point).toHaveProperty("consumptionKwh");
        });
    }

    validateConsumptionValues(points: GraphPoint[]) {
        points.forEach((point) => {
            expect(
                typeof point.consumptionKwh === "number" ||
                    point.consumptionKwh === null,
            ).toBeTruthy();
            if (point.consumptionKwh != null) {
                expect(point.consumptionKwh).toBeGreaterThanOrEqual(0);
            }
        });
    }

    validateLabelFormat(points: GraphPoint[]) {
        points.forEach((point) => {
            expect(point.label).toMatch(/^\d{1,2} [A-Za-z]{3}$/);
        });
    }

    validateBusinessRules(data: { period: string; points: unknown[] }) {
        expect(data).toHaveProperty("period");
        expect(data).toHaveProperty("points");
    }
}
