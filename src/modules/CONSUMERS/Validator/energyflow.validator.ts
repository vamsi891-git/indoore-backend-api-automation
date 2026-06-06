import { expect } from "@playwright/test";
import { EnergyFlowPoint } from "../Mapper/energyflow.mapper";

export class EnergyFlowValidator {
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
        expect(["daily", "weekly", "monthly"]).toContain(data.period);
    }

    validatePointsCount(data: { points: unknown[] }) {
        expect(data.points.length).toBeGreaterThan(0);
    }

    validatePointStructure(points: EnergyFlowPoint[]) {
        points.forEach((point) => {
            expect(point).toHaveProperty("label");
            expect(point).toHaveProperty("kwhImport");
            expect(point).toHaveProperty("kvahImport");
            expect(point).toHaveProperty("kwhExport");
            expect(point).toHaveProperty("kvahExport");
        });
    }

    validateLabelFormat(points: EnergyFlowPoint[]) {
        points.forEach((point) => {
            expect(point.label).toMatch(/^\d{1,2} [A-Za-z]{3}$/);
        });
    }

    validateEnergyValues(points: EnergyFlowPoint[]) {
        points.forEach((point) => {
            expect(point.kwhImport).toBeGreaterThanOrEqual(0);
            expect(point.kvahImport).toBeGreaterThanOrEqual(0);
            expect(point.kwhExport).toBeGreaterThanOrEqual(0);
            expect(point.kvahExport).toBeGreaterThanOrEqual(0);
        });
    }

    validateBusinessLogic(data: { period: string; points: unknown[] }) {
        expect(data).toHaveProperty("period");
        expect(data).toHaveProperty("points");
    }
}
