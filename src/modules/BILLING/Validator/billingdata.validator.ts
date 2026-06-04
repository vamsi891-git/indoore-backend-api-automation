import { expect } from "@playwright/test";
import { BillingData, BillingItem} from "../Mapper/billingdata.mapper";
export class BillingDataValidator {
    validateBillingDataExists(data: BillingData) {
        expect(data).toBeTruthy();
        expect(data.items).toBeDefined();
    }
    validatePagination(data: BillingData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.items.length).toBeLessThanOrEqual(data.limit);
        if (data.total > 0) {
            expect(data.totalPages).toBe(Math.ceil(data.total / data.limit)
                );
        }

    }
    validateBillingItems(data: BillingData) {
        data.items.forEach(item => {
            expect(item.slNo).toBeGreaterThan(0);
            expect(item.meterNumber).toBeTruthy();
            expect(item.phase).toBeTruthy();
            expect(item.billingDate).toBeTruthy();
            expect(item.entryDateTime).toBeTruthy();
            expect(item.mf).toBeGreaterThan(0);
            expect(item.billOnMin).toBeGreaterThanOrEqual(0);
            expect(item.kwhC).toBeGreaterThanOrEqual(0);
            expect(item.kvahC).toBeGreaterThanOrEqual(0);
        });

    }

    validatePowerFactor(data: BillingData) {
        data.items.forEach(item => {
            expect(item.pf).toBeGreaterThanOrEqual(0);
            expect(item.pf).toBeLessThanOrEqual(1);
        });
    }
    validateEnergyCalculation(data: BillingData) {
        data.items.forEach(item => {
            const totalKwh = item.kwhT1 + item.kwhT2 + item.kwhT3 + item.kwhT4;
            expect(Math.abs(item.kwhC - totalKwh)).toBeLessThanOrEqual(10);
        });
    }
    validateKvahCalculation(data: BillingData) {
        data.items.forEach(item => {
            const totalKvah = item.kvahT1 + item.kvahT2 + item.kvahT3 + item.kvahT4;
            expect(Math.abs(item.kvahC - totalKvah)).toBeLessThanOrEqual(10);
        });
    }
    validateElectricalBusinessRules(data: BillingData) {
        data.items.forEach(item => {
            expect(item.kvahC).toBeGreaterThanOrEqual(item.kwhC);
            expect(item.mdKva).toBeGreaterThanOrEqual(item.mdKw);
        });
    }
    validateExportEnergy(data: BillingData) {
        data.items.forEach(item => {
            expect(item.kwhExpC).toBeGreaterThanOrEqual(0);
            expect(item.kvahExpC).toBeGreaterThanOrEqual(0);
        });
    }
    validateBillingMonthYear(data: BillingData,expectedMonth: number,expectedYear: number) {
        expect(data.month).toBe(expectedMonth);
        expect(data.year).toBe(expectedYear);
        data.items.forEach(item => {
            const billingDate = new Date(item.billingDate);
            expect(billingDate.getMonth() + 1).toBe(expectedMonth);
            expect(billingDate.getFullYear()).toBe(expectedYear);
        });
    }
    validateDuplicateSlNos(data: BillingData) {
        const slNos =data.items.map(item => item.slNo);
        const duplicates =slNos.filter((value,index) =>slNos.indexOf(value)!== index
            );
        if (duplicates.length) {
            console.log("Duplicate SL Numbers:",duplicates);
        }
        expect(duplicates.length).toBe(0);
    }
    validateDuplicateBillingRecords(data: BillingData) {
        const keys =data.items.map(item =>`${item.meterNumber}_${item.billingDate}_${item.entryDateTime}`);
        const duplicates =keys.filter((value,index) =>keys.indexOf(value) !== index);
        if (duplicates.length) {
            console.log("Duplicate Billing Records:",duplicates);
        }
        expect(duplicates.length).toBe(0);
    }
    validateNaNValues(data: BillingData) {
        data.items.forEach(item => {
            const numericFields = [
                item.mf,
                item.pf,
                item.kwhC,
                item.kwhT1,
                item.kwhT2,
                item.kwhT3,
                item.kwhT4,
                item.kvahC,
                item.kvahT1,
                item.kvahT2,
                item.kvahT3,
                item.kvahT4,
                item.mdKw,
                item.mdKva,
                item.billOnMin,
                item.kwhExpC,
                item.kvahExpC

            ];
            numericFields.forEach(field => {
                expect( Number.isNaN(field)).toBeFalsy();
            });
        });
    }

    validateNoDataScenario(data: BillingData) {
        if (data.total === 0) {
            expect(data.items.length).toBe(0);
        }
    }
}