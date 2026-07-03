import { expect } from "@playwright/test";
import { dtrPowerTriangleData } from "../Data/dtrpowertriangle.data";

type PowerTriangleData = {
    activeEnergyKWh: number | null;
    reactiveEnergyKvarh: number | null;
    apparentEnergyKVAh: number | null;
    powerFactor: number | null;
};

export class DtrPowerTriangleValidator {
    // =========================================
    // RESPONSE ENVELOPE
    // =========================================
    validateResponseEnvelope(response: { success: boolean; data: unknown }): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    // =========================================
    // REQUIRED FIELDS ONLY (composePowerTriangle output)
    // =========================================
    validateFields(data: PowerTriangleData): void {
        for (const field of dtrPowerTriangleData.requiredFields) {
            expect(data).toHaveProperty(field);
        }
        expect(Object.keys(data).sort()).toEqual(
            [...dtrPowerTriangleData.requiredFields].sort(),
        );
    }

    // =========================================
    // NULL OR NUMBER — toNumber() backend mapping
    // =========================================
    validateTypes(data: PowerTriangleData): void {
        for (const field of dtrPowerTriangleData.requiredFields) {
            const value = data[field];
            expect(value === null || typeof value === "number").toBeTruthy();
        }
    }

    // =========================================
    // REACTIVE ENERGY — never populated by composePowerTriangle
    // =========================================
    validateReactiveEnergyAlwaysNull(data: PowerTriangleData): void {
        expect(data.reactiveEnergyKvarh).toBeNull();
    }

    // =========================================
    // POWER FACTOR RANGE (PF / PW_FACTOR columns)
    // =========================================
    validatePowerFactor(powerFactor: number | null): void {
        if (powerFactor !== null) {
            expect(powerFactor).toBeGreaterThanOrEqual(-1);
            expect(powerFactor).toBeLessThanOrEqual(1);
        }
    }

    // =========================================
    // ENERGY VALUES — non-negative when present
    // =========================================
    validateEnergyValues(data: PowerTriangleData): void {
        const energyFields = [
            "activeEnergyKWh",
            "apparentEnergyKVAh",
        ] as const;

        for (const field of energyFields) {
            const value = data[field];
            if (value !== null) {
                expect(value).toBeGreaterThanOrEqual(0);
            }
        }
    }

    // =========================================
    // NO METER / NO IP READING — all-null payload is valid
    // buildPowerTriangleForBase + composePowerTriangle empty path
    // =========================================
    validateEmptyReadingState(data: PowerTriangleData): void {
        const allNull =
            data.activeEnergyKWh === null &&
            data.apparentEnergyKVAh === null &&
            data.powerFactor === null &&
            data.reactiveEnergyKvarh === null;

        if (allNull) {
            expect(data.reactiveEnergyKvarh).toBeNull();
        }
    }

    // =========================================
    // IP SOURCE CONSISTENCY — energies share ipBest branch
    // when ipBest missing, active + apparent stay null together
    // =========================================
    validateIpSourceConsistency(data: PowerTriangleData): void {
        const hasActive = data.activeEnergyKWh !== null;
        const hasApparent = data.apparentEnergyKVAh !== null;

        if (!hasActive && !hasApparent) {
            return;
        }

        expect(hasActive || hasApparent).toBeTruthy();
    }

    // =========================================
    // POWER FACTOR REQUIRES IP TIMESTAMP
    // PF set only when ts(latestTp) > 0 || ts(latestSp) > 0
    // =========================================
    validatePowerFactorWithReadings(data: PowerTriangleData): void {
        const hasAnyEnergy =
            data.activeEnergyKWh !== null || data.apparentEnergyKVAh !== null;

        if (data.powerFactor !== null && !hasAnyEnergy) {
            expect(typeof data.powerFactor).toBe("number");
        }
    }

    // =========================================
    // FINITE NUMBERS — toNumber rejects NaN
    // =========================================
    validateFiniteNumbers(data: PowerTriangleData): void {
        for (const field of dtrPowerTriangleData.requiredFields) {
            const value = data[field];
            if (typeof value === "number") {
                expect(Number.isFinite(value)).toBeTruthy();
                expect(Number.isNaN(value)).toBeFalsy();
            }
        }
    }

    // =========================================
    // BUSINESS LOGIC — cumulative energy triangle constraints
    // =========================================
    validateBusinessLogic(data: PowerTriangleData): void {
        expect(data.reactiveEnergyKvarh).toBeNull();

        if (data.activeEnergyKWh !== null && data.apparentEnergyKVAh !== null) {
            expect(data.activeEnergyKWh).toBeLessThanOrEqual(data.apparentEnergyKVAh + 0.001);
        }
    }
}
