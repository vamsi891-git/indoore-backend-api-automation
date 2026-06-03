import { expect } from "@playwright/test";
export class LiveLoadProfileValidator {
    validateSuccess(data: any) {
        expect(data.success).toBeTruthy();
    }
    validateStructure(data: any) {
        expect(data.lastReadingIso).toBeDefined();
        expect(data.meterPhase).toBeDefined();
        [data.activePower,data.apparentPower,data.reactivePower]
            .forEach(metric => {
                expect(metric).toHaveProperty("title");
                expect(metric).toHaveProperty("value");
                expect(metric).toHaveProperty("unit");
                expect(metric).toHaveProperty("sharePercent");
            });
        expect(data.powerFactor).toHaveProperty("value");
    }
    validateTitles(data: any) {
        expect(data.activePower.title).toBe("Active Power");
        expect(data.apparentPower.title).toBe("Apparent Power");
        expect(data.reactivePower.title).toBe("Reactive Power");
        expect(data.powerFactor.title).toBe("Power Factor");
    }
    validateUnits(data: any) {
        expect(data.activePower.unit).toBe("kW");
        expect(data.apparentPower.unit).toBe("kVA");
        expect(data.reactivePower.unit).toBe("kVAr");
        expect(data.powerFactor.unit).toBe("Power Factor");
    }
    validateMeterPhase(data: any) {
        expect(["SP", "TP", null]).toContain(data.meterPhase);
    }
    validateNullable(data: any) {
        [data.activePower,data.apparentPower,data.reactivePower,data.powerFactor]
            .forEach(metric => {
                expect(typeof metric.value === "number" || metric.value === null).toBeTruthy();
            })
    }
    validatePowerFactor(data: any) {
        if (data.powerFactor.value != null) {
            expect(data.powerFactor.value).toBeGreaterThanOrEqual(-1);
            expect(data.powerFactor.value).toBeLessThanOrEqual(1);
        }
    }
    validatePowerRanges(data: any) {
        if (data.activePower.value != null) {
            expect(data.activePower.value).toBeGreaterThanOrEqual(0);
        }
        if (data.apparentPower.value != null) {
            expect(data.apparentPower.value).toBeGreaterThanOrEqual(0);
        }
        if (data.reactivePower.value!= null) {
            expect(data.reactivePower.value).toBeGreaterThanOrEqual(0);
        }
    }
    /*
    Backend:
    kVA>=kW
    reactive:
    √(kVA²−kW²)
    */
    validatePowerRules(data: any) {
        const kw =data.activePower.value;
        const kva =data.apparentPower.value;
        const kvar =data.reactivePower.value;
        if (kw != null && kva != null) {
            expect(kva).toBeGreaterThanOrEqual(kw);
        }
        if (kw != null && kva != null && kvar != null) {
            const expected = Math.sqrt(Math.max((kva * kva) - (kw * kw), 0 ));
            expect(Math.abs(expected - kvar)).toBeLessThan(1);
        }
    }
    validateSharePercent(data: any) {
        const active =data.activePower;
        const apparent =data.apparentPower;
        if (apparent.value!= null) {
            expect(apparent.sharePercent).toBe(100);
        }
        if ( active.value != null && apparent.value != null ) {
            const expected = Number((active.value / apparent.value * 100).toFixed(1));
            expect(Math.abs(expected -active.sharePercent)).toBeLessThan(1);
        }
    }
    validateDate(data: any) {
        if (data.lastReadingIso) {
            expect(isNaN(Date.parse(data.lastReadingIso))).toBeFalsy();
        }
    }
}