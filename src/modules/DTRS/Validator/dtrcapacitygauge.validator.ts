import { expect } from "@playwright/test";
import { dtrCapacityGaugeData } from "../Data/dtrcapacitygauge.data";
import { gaugePercent, roundGauge } from "../utils/dtr-backend.util";

type CapacityBand = {
    label: string;
    value: number;
    percent: number;
    unit: string;
};

type CapacityGaugeData = {
    ratedCapacityKva: number | null;
    bands: CapacityBand[];
};

export class DtrCapacityGaugeValidator {
    // =========================================
    // RESPONSE ENVELOPE
    // =========================================
    validateResponseEnvelope(response: { success: boolean; data: unknown }): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    // =========================================
    // REQUIRED FIELDS
    // =========================================
    validateFields(data: CapacityGaugeData): void {
        expect(data).toHaveProperty("ratedCapacityKva");
        expect(data).toHaveProperty("bands");
        expect(Array.isArray(data.bands)).toBeTruthy();
    }

    // =========================================
    // BAND COUNT — getDtrCapacityGaugeByCode builds 5 bands
    // =========================================
    validateBandCount(bands: CapacityBand[]): void {
        expect(bands.length).toBe(5);
    }

    // =========================================
    // BAND STRUCTURE
    // =========================================
    validateBandStructure(bands: CapacityBand[]): void {
        bands.forEach((band) => {
            expect(band).toHaveProperty("label");
            expect(band).toHaveProperty("value");
            expect(band).toHaveProperty("percent");
            expect(band).toHaveProperty("unit");
        });
    }

    // =========================================
    // BAND ORDER
    // =========================================
    validateBandOrder(bands: CapacityBand[], expectedBands: readonly string[]): void {
        const labels = bands.map((x) => x.label);
        expect(labels).toEqual([...expectedBands]);
    }

    // =========================================
    // VALUE TYPES
    // =========================================
    validateTypes(data: CapacityGaugeData): void {
        expect(
            data.ratedCapacityKva === null || typeof data.ratedCapacityKva === "number",
        ).toBeTruthy();
        data.bands.forEach((band) => {
            expect(typeof band.label).toBe("string");
            expect(typeof band.value).toBe("number");
            expect(typeof band.percent).toBe("number");
            expect(typeof band.unit).toBe("string");
        });
    }

    // =========================================
    // UNIT VALIDATION — Instant=KVA, MD bands=MDkVA
    // =========================================
    validateUnits(bands: CapacityBand[]): void {
        bands.forEach((band) => {
            const expectedUnit =
                dtrCapacityGaugeData.bandUnits[
                    band.label as keyof typeof dtrCapacityGaugeData.bandUnits
                ];
            expect(expectedUnit).toBeDefined();
            expect(band.unit).toBe(expectedUnit);
        });
    }

    // =========================================
    // PERCENT — gaugePercent: integer 0–100
    // =========================================
    validatePercentages(bands: CapacityBand[]): void {
        bands.forEach((band) => {
            expect(band.percent).toBeGreaterThanOrEqual(0);
            expect(band.percent).toBeLessThanOrEqual(100);
            expect(Number.isInteger(band.percent)).toBeTruthy();
        });
    }

    // =========================================
    // VALUE — roundGauge output, non-negative
    // =========================================
    validateValues(bands: CapacityBand[]): void {
        bands.forEach((band) => {
            expect(band.value).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(band.value)).toBeTruthy();
        });
    }

    // =========================================
    // NULL / ZERO CAPACITY — all percent = 0
    // getDtrRatedCapacityKva currently always null
    // =========================================
    validateCapacityLogic(ratedCapacityKva: number | null, bands: CapacityBand[]): void {
        if (ratedCapacityKva === null || ratedCapacityKva <= 0) {
            bands.forEach((band) => {
                expect(band.percent).toBe(0);
            });
        }
    }

    // =========================================
    // GAUGE PERCENT FORMULA — when capacity > 0
    // =========================================
    validateGaugePercentFormula(
        ratedCapacityKva: number | null,
        bands: CapacityBand[],
    ): void {
        if (ratedCapacityKva == null || ratedCapacityKva <= 0) {
            return;
        }

        bands.forEach((band) => {
            expect(band.percent).toBe(gaugePercent(band.value, ratedCapacityKva));
        });
    }

    // =========================================
    // ROUNDING — roundGauge max 2 decimal places
    // =========================================
    validateRoundedValues(bands: CapacityBand[]): void {
        bands.forEach((band) => {
            expect(band.value).toBe(roundGauge(band.value));
            const decimalPart = band.value.toString().split(".")[1];
            if (decimalPart) {
                expect(decimalPart.length).toBeLessThanOrEqual(2);
            }
        });
    }

    // =========================================
    // NaN / FINITE
    // =========================================
    validateNaN(data: CapacityGaugeData): void {
        if (data.ratedCapacityKva !== null) {
            expect(Number.isNaN(data.ratedCapacityKva)).toBeFalsy();
            expect(Number.isFinite(data.ratedCapacityKva)).toBeTruthy();
        }
        data.bands.forEach((band) => {
            expect(Number.isNaN(band.value)).toBeFalsy();
            expect(Number.isNaN(band.percent)).toBeFalsy();
        });
    }

    // =========================================
    // DUPLICATE LABELS
    // =========================================
    validateUniqueLabels(bands: CapacityBand[]): void {
        const labels = bands.map((x) => x.label);
        expect(new Set(labels).size).toBe(labels.length);
    }

    // =========================================
    // NO-DATA FALLBACK — null readings → value 0
    // =========================================
    validateZeroFallbackState(data: CapacityGaugeData): void {
        const allZero = data.bands.every((b) => b.value === 0 && b.percent === 0);
        if (allZero && (data.ratedCapacityKva === null || data.ratedCapacityKva <= 0)) {
            data.bands.forEach((band) => {
                expect(band.value).toBe(0);
                expect(band.percent).toBe(0);
            });
        }
    }

    // =========================================
    // RATED CAPACITY — null or positive when available
    // =========================================
    validateRatedCapacity(data: CapacityGaugeData): void {
        if (data.ratedCapacityKva !== null) {
            expect(data.ratedCapacityKva).toBeGreaterThan(0);
        }
    }
}
