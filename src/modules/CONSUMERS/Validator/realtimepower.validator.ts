import { expect } from "@playwright/test";
export class RealTimePowerValidator {
    validateSuccess(data: any): void {
        expect(data.success).toBeTruthy();
    }
    validateRPhaseExists(data: any): void {
        expect(data.rPhase).toBeDefined();
        expect(data.rPhase).not.toBeNull();
    }
    validateSinglePhaseLogic(data: any): void {
        /*
        backend SP logic
        */
        expect(data.yPhase).toBeNull();
        expect(data.bPhase).toBeNull();
    }

    validateUnits(data: any): void {
        expect(data.rPhase.voltageUnit).toBe("Volts");
        expect(data.rPhase.currentUnit).toBe("Amps");
        expect(data.rPhase.powerFactorUnit).toBe("Power Factor");
    }
    validateNullableValues(data: any): void {
        expect(typeof data.rPhase.voltage === "number" || data.rPhase.voltage === null).toBeTruthy();
        expect(typeof data.rPhase.current === "number" || data.rPhase.current === null).toBeTruthy();
        expect(typeof data.rPhase.powerFactor === "number" || data.rPhase.powerFactor === null).toBeTruthy();

    }
    validateVoltageRange(data: any) {
        if (data.rPhase.voltage != null) {
            expect(data.rPhase.voltage).toBeGreaterThan(0);
            expect(data.rPhase.voltage).toBeLessThan(350);
        }
    }
    validateCurrentRange(data: any) {
        if (data.rPhase.current != null) {
            expect(data.rPhase.current).toBeGreaterThanOrEqual(0);
            expect(data.rPhase.current).toBeLessThan(1000);
        }
    }
    validatePowerFactor(data: any) {
        if (data.rPhase.powerFactor != null ) {
            expect(data.rPhase.powerFactor).toBeGreaterThanOrEqual(-1);
            expect(data.rPhase.powerFactor).toBeLessThanOrEqual(1);
        }
    }
    validateCrossField(data: any) {
        if (data.rPhase.current === null && data.rPhase.voltage === null) {
            expect(data.rPhase.powerFactor).toBeNull();
        }
    }
    validateBusinessRules(data: any) {
        expect(data.rPhase).toHaveProperty("voltage");
        expect(data.rPhase).toHaveProperty("current");
        expect(data.rPhase).toHaveProperty("powerFactor");
    }
}