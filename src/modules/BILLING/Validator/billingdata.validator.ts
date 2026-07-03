import { expect } from "@playwright/test";
import { BillingData } from "../Mapper/billingdata.mapper";
import {
    BillingDataResponseSchema,
    type ParsedBillingDataResponse,
} from "../schemas/billing.schemas";
import {
    resolveBillingDate,
    sumBillingTiers,
} from "../utils/billing-item.helper";

/** API dates are `YYYY-MM-DD HH:mm:ss` — parse calendar parts to avoid TZ drift. */
function billingCalendarParts(billingDate: string): { month: number; year: number } {
    const datePart = billingDate.trim().slice(0, 10);
    const [year, month] = datePart.split("-").map(Number);
    return { year, month };
}

export class BillingDataValidator {
    validateZodResponseSchema(body: unknown): ParsedBillingDataResponse {
        const result = BillingDataResponseSchema.safeParse(body);
        expect(
            result.success,
            result.success
                ? "Zod validation passed"
                : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
        ).toBe(true);
        return result.data!;
    }

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
            expect(resolveBillingDate(item)).toBeTruthy();
            expect(item.entryDateTime).toBeTruthy();
            if (item.mf != null) {
                expect(item.mf).toBeGreaterThan(0);
            }
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
            const totalKwh = sumBillingTiers(item, "kwhT");
            expect(Math.abs((item.kwhC ?? 0) - totalKwh)).toBeLessThanOrEqual(10);
        });
    }
    validateKvahCalculation(data: BillingData) {
        data.items.forEach(item => {
            const totalKvah = sumBillingTiers(item, "kvahT");
            expect(Math.abs((item.kvahC ?? 0) - totalKvah)).toBeLessThanOrEqual(10);
        });
    }
    validateElectricalBusinessRules(data: BillingData) {
        data.items.forEach(item => {
            if (item.kvahC != null && item.kwhC != null) {
                expect(item.kvahC).toBeGreaterThanOrEqual(item.kwhC);
            }
            if (item.mdKva != null && item.mdKw != null) {
                expect(item.mdKva).toBeGreaterThanOrEqual(item.mdKw);
            }
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
        data.items.forEach((item) => {
            const billingDate = resolveBillingDate(item);
            expect(billingDate).toBeTruthy();
            const { month, year } = billingCalendarParts(billingDate!);
            expect(month).toBe(expectedMonth);
            expect(year).toBe(expectedYear);
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
        const keys =data.items.map(item =>`${item.meterNumber}_${resolveBillingDate(item)}_${item.entryDateTime}`);
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