import { expect } from "@playwright/test";
export class MonthlyNetMeterValidator {
    validateItems(data: any): void {
        expect(Array.isArray(data.items)).toBeTruthy();
    }
    validatePagination(data: any): void {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
    }
    validateRequiredFields(items: any[]): void {
        items.forEach(item => {
            expect(item).toHaveProperty("slNo");
            expect(item).toHaveProperty("circle");
            expect(item).toHaveProperty("division");
            expect(item).toHaveProperty("subDivision");
            expect(item).toHaveProperty("zone");
            expect(item).toHaveProperty("feeder");
            expect(item).toHaveProperty("dtr");
            expect(item).toHaveProperty("name");
            expect(item).toHaveProperty("ivrsNumber");
            expect(item).toHaveProperty("msn");
            expect(item).toHaveProperty("phase");
            expect(item).toHaveProperty("kwh");
            expect(item).toHaveProperty("kvah");
            expect(item).toHaveProperty("kwhExport");
            expect(item).toHaveProperty("kvahExport");
            expect(item).toHaveProperty("netKwh");
            expect(item).toHaveProperty("netKvah");
        });
    }
    validateTypes(items: any[]): void {
        items.forEach(item => {
            expect(typeof item.slNo).toBe("number");
            expect(typeof item.name).toBe("string");
            if (item.kwh !== null)
                expect(typeof item.kwh).toBe("number");
            if (item.kvah !== null)
                expect(typeof item.kvah).toBe("number");
            if (item.kwhExport !== null)
                expect(typeof item.kwhExport).toBe("number");
            if (item.kvahExport !== null)
                expect(typeof item.kvahExport).toBe("number");
        });
    }
    validateNetKwhLogic(items: any[]): void {
        items.forEach(item => {
            if (item.kwh !== null &&  item.kwhExport !== null ) {
                expect(item.netKwh).toBeCloseTo(item.kwh - item.kwhExport,2);
            }
        });
    }
    validateNetKvahLogic(items: any[]): void {
        items.forEach(item => {
            if (item.kvah !== null &&item.kvahExport !== null) {
                expect(item.netKvah).toBeCloseTo(item.kvah - item.kvahExport,2);
            }
        });
    }
    validateNullHandling(items: any[]): void {
        items.forEach(item => {
            if (item.kwh === null ||item.kwhExport === null) {
                expect(item.netKwh).toBeNull();
            }
            if (item.kvah === null ||item.kvahExport === null
            ) {
                expect(item.netKvah).toBeNull();
            }
        });
    }
    validateNoNaN(items: any[]): void {
        items.forEach(item => {
            [item.kwh,item.kvah,item.kwhExport,item.kvahExport,item.netKwh,item.netKvah].forEach(value => {
                if (value !== null) {
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            });
        });
    }
}