import { expect } from "@playwright/test";
export class DtrCapacityGaugeValidator {
    // =========================================
    // REQUIRED FIELDS
    // =========================================
    validateFields(data: any): void {
        expect(data).toHaveProperty("ratedCapacityKva");
        expect(data).toHaveProperty("bands");
        expect(Array.isArray(data.bands)).toBeTruthy();
    }
    // =========================================
    // BAND COUNT
    //=========================================
    validateBandCount(bands: any[]): void {
        expect(bands.length).toBe(5);
    }
    // =========================================
    // BAND STRUCTURE
    // =========================================
    validateBandStructure(bands: any[]): void {
        bands.forEach(band => {
            expect(band).toHaveProperty("label");
            expect(band).toHaveProperty("value");
            expect(band).toHaveProperty("percent");
            expect(band).toHaveProperty("unit");
        });
    }
    // =========================================
    // BAND ORDER
    // =========================================
    validateBandOrder(bands: any[],expectedBands: string[]): void {
        const labels =bands.map(x => x.label );
        expect(labels).toEqual(expectedBands);
    }
    // =========================================
    // VALUE TYPES
    // =========================================
    validateTypes(data: any): void {
        expect(data.ratedCapacityKva === null ||typeof data.ratedCapacityKva === "number").toBeTruthy();
        data.bands.forEach((band: any) => {
            expect(typeof band.label).toBe("string");
            expect(typeof band.value).toBe("number");
            expect(typeof band.percent).toBe("number");
            expect(typeof band.unit).toBe("string");
        });
    }

    // =========================================
    // UNIT VALIDATION
    // =========================================
    validateUnits(bands: any[]): void {
        bands.forEach((band: any) => {
            if (band.label === "Instant") {
                expect(band.unit).toBe("KVA");
            }
            else {
                expect(band.unit).toBe("MDkVA");
            }
        });
    }
    // =========================================
    // PERCENT VALIDATION
    // =========================================
    validatePercentages(bands: any[]): void {
        bands.forEach((band: any) => {
            expect(band.percent).toBeGreaterThanOrEqual(0);
            expect(band.percent).toBeLessThanOrEqual(100);
            expect(Number.isInteger(band.percent)).toBeTruthy();
        });
    }
    // =========================================
    // VALUE VALIDATION
    // =========================================
    validateValues(bands: any[]): void {
        bands.forEach((band: any) => {
            expect(band.value).toBeGreaterThanOrEqual(0);
        });
    }
    // =========================================
    // CAPACITY LOGIC
    // =========================================
    validateCapacityLogic(ratedCapacityKva: number | null,bands: any[]): void {
        // backend logic:
        // if capacity null/0
        // all percentages become 0
        if (ratedCapacityKva === null || ratedCapacityKva <= 0) {
            bands.forEach((band: any) => {
                expect(band.percent).toBe(0);
            });
        }
    }
    // =========================================
    // ROUNDING VALIDATION
    // =========================================
    validateRoundedValues(bands: any[]): void {
        bands.forEach((band: any) => {
            const decimalPart =band.value.toString().split(".")[1];
            if (decimalPart) {
                expect(decimalPart.length).toBeLessThanOrEqual(2);
            }
        });
    }
    // =========================================
    // NaN VALIDATION
    // =========================================
    validateNaN(data: any): void {
        if (data.ratedCapacityKva !== null) {
            expect(Number.isNaN(data.ratedCapacityKva)).toBeFalsy();
        }
        data.bands.forEach((band: any) => {
            expect(Number.isNaN(band.value)).toBeFalsy();
            expect(Number.isNaN(band.percent)).toBeFalsy();
        });
    }
    // =========================================
    // DUPLICATE LABELS
    // =========================================
    validateUniqueLabels(bands: any[]): void {
        const labels =bands.map(x => x.label);
        const unique =new Set(labels);
        expect(unique.size).toBe(labels.length);
    }
}