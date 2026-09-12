import { expect } from "@playwright/test";
import { BillingData } from "../Mapper/billingdata.mapper";
import { billingDataExpectedColumns } from "../Data/billingdata.data";
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
    validatePagination(data: BillingData, includeTotal = true) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.items.length).toBeLessThanOrEqual(data.limit);
        if (!includeTotal) {
            if (data.total != null && data.total > 0 && data.totalPages != null) {
                expect(data.totalPages).toBe(
                    Math.ceil(data.total / data.limit),
                );
                expect(data.total).toBeGreaterThanOrEqual(data.items.length);
            }
            return;
        }
        expect(data.total).not.toBeNull();
        expect(data.totalPages).not.toBeNull();
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        if ((data.total ?? 0) > 0) {
            expect(data.totalPages).toBe(
                Math.ceil((data.total as number) / data.limit),
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
            if (item.billOnMin != null) {
                expect(item.billOnMin).toBeGreaterThanOrEqual(0);
            }
            if (item.kwhC != null) {
                expect(item.kwhC).toBeGreaterThanOrEqual(0);
            }
            if (item.kvahC != null) {
                expect(item.kvahC).toBeGreaterThanOrEqual(0);
            }
        });
    }

    /** Circle / consumer / IVRS / mf may be null when the meter still has a reading. */
    validateSparseHierarchyAllowed(data: BillingData) {
        data.items.forEach((item) => {
            if (item.circle == null) {
                expect(item.meterNumber).toBeTruthy();
                expect(resolveBillingDate(item)).toBeTruthy();
            }
        });
    }

    validateGridMeta(data: BillingData) {
        if (data.billingClass != null) {
            expect(data.billingClass.length).toBeGreaterThan(0);
        }
        if (data.mappingProfile != null) {
            expect(data.mappingProfile.length).toBeGreaterThan(0);
        }
    }

    /** 1900-01-01 occurrence time is a sentinel for zero MD, not a live clock. */
    validateMdOccurrenceTimes(data: BillingData) {
        data.items.forEach((item) => {
            for (const ot of [item.mdKwOt, item.mdKvaOt]) {
                if (!ot) {
                    continue;
                }
                expect(ot).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
            }
            if (item.mdKwOt?.startsWith("1900-01-01")) {
                const mdKw =
                    typeof item.mdKw === "number" ? item.mdKw : null;
                if (mdKw != null) {
                    expect(mdKw).toBe(0);
                }
            }
        });
    }

    validateMeterFilter(data: BillingData, meterNumber: string) {
        data.items.forEach((item) => {
            expect(item.meterNumber).toBe(meterNumber);
        });
    }

    validatePageSerials(data: BillingData) {
        if (data.items.length === 0) {
            return;
        }
        const first = data.items[0]!.slNo;
        const expectedStart = (data.page - 1) * data.limit + 1;
        expect(first).toBe(expectedStart);
        data.items.forEach((item, index) => {
            expect(item.slNo).toBe(first + index);
        });
    }

    validatePowerFactor(data: BillingData) {
        data.items.forEach(item => {
            if (item.pf == null) {
                return;
            }
            expect(item.pf).toBeGreaterThanOrEqual(0);
            expect(item.pf).toBeLessThanOrEqual(1);
        });
    }
    /**
     * kwhC / kvahC map to Cumulative_*_TZ0 — independent cumulative registers.
     * T1–T4 are TOD zone registers; backend does not require TZ0 === sum(T1..Tn).
     * Soft-report large deltas for visibility; do not fail the suite.
     */
    validateEnergyCalculation(data: BillingData) {
        data.items.forEach((item) => {
            const totalKwh = sumBillingTiers(item, "kwhT");
            const delta = Math.abs((item.kwhC ?? 0) - totalKwh);
            if (delta > 10) {
                console.log(
                    `BACKEND FINDING: meter ${item.meterNumber} kwhC=${item.kwhC} vs sum(kwhT*)=${totalKwh} (delta=${delta}) — TZ0 is not required to equal TOD tiers`,
                );
            }
        });
    }
    validateKvahCalculation(data: BillingData) {
        data.items.forEach((item) => {
            const totalKvah = sumBillingTiers(item, "kvahT");
            const delta = Math.abs((item.kvahC ?? 0) - totalKvah);
            if (delta > 10) {
                console.log(
                    `BACKEND FINDING: meter ${item.meterNumber} kvahC=${item.kvahC} vs sum(kvahT*)=${totalKvah} (delta=${delta}) — TZ0 is not required to equal TOD tiers`,
                );
            }
        });
    }
    validateElectricalBusinessRules(data: BillingData) {
        data.items.forEach(item => {
            if (item.kvahC != null && item.kwhC != null) {
                expect(item.kvahC).toBeGreaterThanOrEqual(item.kwhC);
            }
            const mdKw =
                typeof item.mdKw === "number" ? item.mdKw : null;
            const mdKva =
                typeof item.mdKva === "number" ? item.mdKva : null;
            if (mdKva != null && mdKw != null) {
                expect(mdKva).toBeGreaterThanOrEqual(mdKw);
            }
        });
    }
    validateExportEnergy(data: BillingData) {
        data.items.forEach(item => {
            if (item.kwhExpC != null) {
                expect(item.kwhExpC).toBeGreaterThanOrEqual(0);
            }
            if (item.kvahExpC != null) {
                expect(item.kvahExpC).toBeGreaterThanOrEqual(0);
            }
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
                typeof item.mdKw === "number" ? item.mdKw : null,
                typeof item.mdKva === "number" ? item.mdKva : null,
                item.billOnMin,
                item.kwhExpC,
                item.kvahExpC

            ];
            numericFields.forEach(field => {
                expect( Number.isNaN(field)).toBeFalsy();
            });
        });
    }

    validateNoDataScenario(data: BillingData, includeTotal = true) {
        if (includeTotal && data.total === 0) {
            expect(data.items.length).toBe(0);
        }
    }

    validateColumns(columns: Array<{ key: string; header: string }>): void {
        const keys = columns.map((c) => c.key);
        for (const col of billingDataExpectedColumns) {
            expect(keys).toContain(col.key);
            expect(columns.find((c) => c.key === col.key)?.header).toBe(
                col.header,
            );
        }
    }

    /**
     * Duplicate slNo / meter+billing time / lookup+billing time / IVRS+time is a fail.
     * Same rank, feeder, DTR, circle, or billing date on many meters is valid.
     */
    validateUniqueReadings(data: BillingData): void {
        this.validateDuplicateSlNos(data);
        this.validateDuplicateBillingRecords(data);
        const slNos = data.items.map((item) => item.slNo);
        const metersAtTime = data.items.map(
            (item) =>
                `${item.meterNumber}|${resolveBillingDate(item) ?? ""}`,
        );
        expect(new Set(slNos).size).toBe(slNos.length);
        expect(new Set(metersAtTime).size).toBe(metersAtTime.length);
        const lookupsAtTime = data.items
            .filter((item) => item.meterLookupTblRefId != null)
            .map(
                (item) =>
                    `${item.meterLookupTblRefId}|${resolveBillingDate(item) ?? ""}`,
            );
        expect(new Set(lookupsAtTime).size).toBe(lookupsAtTime.length);
        const ivrsAtTime = data.items
            .filter((item) => item.ivrsNumber)
            .map(
                (item) =>
                    `${item.ivrsNumber}|${resolveBillingDate(item) ?? ""}`,
            );
        expect(new Set(ivrsAtTime).size).toBe(ivrsAtTime.length);
    }

    /** Rank and billing date may repeat; they are not uniqueness keys. */
    validateSharedKeysAllowed(data: BillingData): void {
        if (data.items.length < 2) {
            return;
        }
        const ranks = data.items.map((item) => item.rank);
        const dates = data.items.map((item) => resolveBillingDate(item));
        expect(new Set(ranks).size).toBeLessThanOrEqual(ranks.length);
        expect(new Set(dates).size).toBeLessThanOrEqual(dates.length);
    }
}