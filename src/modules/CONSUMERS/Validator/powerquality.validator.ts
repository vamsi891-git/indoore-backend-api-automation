import { expect } from "@playwright/test";
export class PowerQualityValidator {

    validateSuccess(data: any): void {
        expect(data.success).toBeTruthy();
    }
    validateTitles(data: any): void {
        expect(data.overallPf.title).toBe("Overall PF");
        expect(data.frequency.title).toBe("Frequency");
        expect(data.neutralCurrent.title).toBe("Neutral Current");
        expect(data.mdKw.title).toBe("MD kW");
        expect(data.mdKva.title).toBe("MD kVA");
        expect(data.frequency.title).toBe("Frequency");
        expect(data.neutralCurrent.title).toBe("Neutral Current");
        expect(data.mdKw.title).toBe("MD kW");
        expect(data.mdKva.title).toBe("MD kVA");
    }
    validateUnits(data: any) {
        expect(data.overallPf.unit).toBe("Power Factor");
        expect(data.frequency.unit).toBe("Hz");
        expect(data.neutralCurrent.unit).toBe("Amps");
        expect(data.mdKw.unit).toBe("kW");
        expect(data.mdKva.unit).toBe("kVA");
    }
    validateSubtitles(data: any) {
        const expectedWhenPresent: Record<string, string | RegExp> = {
            overallPf: "System PF",
            frequency: "Frequency",
            neutralCurrent: "Neutral Load",
            mdKw: /Demand/,
            mdKva: /Demand/,
        };

        Object.entries(expectedWhenPresent).forEach(([key, expected]) => {
            const subtitle = data[key]?.subtitle;
            expect(
                subtitle === null || typeof subtitle === "string",
            ).toBeTruthy();
            if (subtitle == null || subtitle === "") {
                return;
            }
            if (expected instanceof RegExp) {
                expect(subtitle).toMatch(expected);
            } else {
                expect(subtitle).toBe(expected);
            }
        });
    }

    validateNullableBehavior(data: any) {
        const metrics = [
            data.overallPf,
            data.frequency,
            data.neutralCurrent,
            data.mdKw,
            data.mdKva
        ];
        metrics.forEach(metric => {
            expect(typeof metric.value === "number" || metric.value === null).toBeTruthy();
        });
    }
    validatePowerFactor(data: any) {
        if (data.overallPf.value != null) {
            expect(data.overallPf.value).toBeGreaterThanOrEqual(-1);
            expect(data.overallPf.value).toBeLessThanOrEqual(1);
        }
    }
    validateFrequency(data: any) {
        if (data.frequency.value != null) {
            expect(data.frequency.value).toBeGreaterThan(45);
            expect(data.frequency.value).toBeLessThan(65);
        }
    }
    validateNeutralCurrent(data: any) {
        if (data.neutralCurrent.value != null) {
            expect(data.neutralCurrent.value).toBeGreaterThanOrEqual(0);
            expect(data.neutralCurrent.value).toBeLessThan(1000);
        }
    }
    validateDemand(data: any) {
        if (data.mdKw.value != null) {
            expect(data.mdKw.value).toBeGreaterThanOrEqual(
                0
            );
        }
        if (data.mdKva.value != null) {
            expect(data.mdKva.value).toBeGreaterThanOrEqual(0);
        }
    }
    validateCrossField(data: any) {
        if (data.mdKw?.value != null && data.mdKva?.value != null) {
            expect(data.mdKva.value).toBeGreaterThanOrEqual(data.mdKw.value);
        }
    }
    validateBusinessRules(data: any) {
        expect(data.overallPf).toHaveProperty("value");
        expect(data.frequency).toHaveProperty("value");
        expect(data.neutralCurrent).toHaveProperty("value");
    }
}