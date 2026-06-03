import { expect } from "@playwright/test";
export class DtrPowerTriangleValidator {
    // =========================================
    // REQUIRED FIELDS
    // =========================================
    validateFields(data: any): void {
        expect(data).toHaveProperty("activeEnergyKWh");
        expect(data).toHaveProperty("reactiveEnergyKvarh");
        expect(data).toHaveProperty("apparentEnergyKVAh");
        expect(data).toHaveProperty("powerFactor");
    }
    // =========================================
    // NULL OR NUMBER VALIDATION
    // =========================================
    validateTypes(data: any): void {
        const fields = ["activeEnergyKWh","reactiveEnergyKvarh","apparentEnergyKVAh","powerFactor"];
        fields.forEach(field => {
            const value = data[field];
            expect(value === null ||  typeof value === "number").toBeTruthy();
        });
    }
    // =========================================
    // POWER FACTOR RANGE
    // =========================================
    validatePowerFactor(powerFactor: number | null): void {
        if (powerFactor !== null) {
            expect( powerFactor).toBeGreaterThanOrEqual(-1);
            expect(powerFactor).toBeLessThanOrEqual(1);
        }
    }
    // =========================================
    // ENERGY VALUE VALIDATION
    // =========================================
    validateEnergyValues(data: any): void {
        const fields = ["activeEnergyKWh","reactiveEnergyKvarh","apparentEnergyKVAh"];
        fields.forEach(field => {
            const value = data[field];
            if (value !== null) {
                expect(value).toBeGreaterThanOrEqual(0);
            }
        });
    }
    // =========================================
    // BACKEND FALLBACK LOGIC
    // =========================================
    validateFallbackLogic(data: any): void {
        // if activeEnergyKWh is null,
        // apparentEnergyKVAh should also
        // normally be null
        if (data.activeEnergyKWh === null) {
            expect(data.apparentEnergyKVAh).toBeNull();
        }
    }
    // =========================================
    // REACTIVE ENERGY LOGIC
    // =========================================
    validateReactiveEnergy(reactiveEnergyKvarh: number | null): void {
        // backend currently never sets value
        expect(reactiveEnergyKvarh).toBeNull();
    }
    // =========================================
    // BUSINESS LOGIC
    // =========================================
    validateBusinessLogic(data: any): void {
        if (data.powerFactor !== null &&data.activeEnergyKWh !== null) {
            expect(data.apparentEnergyKVAh).not.toBeNull();
        }
    }
    // =========================================
    // NaN VALIDATION
    // =========================================
    validateNaN(data: any): void {
        Object.values(data).forEach(value => {
                if (typeof value === "number") {
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            });
    }
}