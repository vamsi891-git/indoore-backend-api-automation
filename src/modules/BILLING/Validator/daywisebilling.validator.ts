import { expect } from "@playwright/test";
import { DaywiseBillingData } from "../Mapper/daywisebilling.mapper";
import { daywiseExpectedColumns } from "../Data/daywisebilling.data";
import {
    DaywiseBillingResponseSchema,
    type ParsedDaywiseBillingResponse,
} from "../schemas/billing.schemas";

function dailyReadings(item: DaywiseBillingData["items"][number]): Array<number | null> {
    return [
        item.d1Kwh, item.d2Kwh, item.d3Kwh, item.d4Kwh, item.d5Kwh,
        item.d6Kwh, item.d7Kwh, item.d8Kwh, item.d9Kwh, item.d10Kwh,
        item.d11Kwh, item.d12Kwh, item.d13Kwh, item.d14Kwh, item.d15Kwh,
        item.d16Kwh, item.d17Kwh, item.d18Kwh, item.d19Kwh, item.d20Kwh,
        item.d21Kwh, item.d22Kwh, item.d23Kwh, item.d24Kwh, item.d25Kwh,
        item.d26Kwh, item.d27Kwh, item.d28Kwh, item.d29Kwh, item.d30Kwh,
        item.d31Kwh,
    ];
}

function daysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

export class DaywiseBillingValidator {
    validateZodResponseSchema(body: unknown): ParsedDaywiseBillingResponse {
        const result = DaywiseBillingResponseSchema.safeParse(body);
        expect(
            result.success,
            result.success
                ? "Zod validation passed"
                : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
        ).toBe(true);
        return result.data!;
    }

    validateDataExists(data: DaywiseBillingData) {
        expect(data).toBeTruthy();
        expect(data.items).toBeDefined();
    }

    validateColumns(columns: Array<{ key: string; header: string }>): void {
        const keys = columns.map((c) => c.key);
        for (const col of daywiseExpectedColumns) {
            expect(keys).toContain(col.key);
            expect(columns.find((c) => c.key === col.key)?.header).toBe(
                col.header,
            );
        }
    }

    validatePagination(data: DaywiseBillingData, includeTotal = false) {
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

    validateMonthYear(
        data: DaywiseBillingData,
        expectedMonth: number,
        expectedYear: number,
    ) {
        expect(data.month).toBe(expectedMonth);
        expect(data.year).toBe(expectedYear);
    }

    /**
     * When totals are an estimate (`totalIsExact=false`), trust `hasMore`.
     * A full page with hasMore=true is the live includeTotal=false shape.
     */
    validateHasMoreFlag(data: DaywiseBillingData) {
        if (data.items.length === 0) {
            expect(data.hasMore).toBe(false);
            return;
        }
        if (data.total != null && data.totalExact) {
            expect(data.hasMore).toBe(data.total > data.page * data.limit);
            return;
        }
        if (data.hasMore && data.items.length === data.limit) {
            return;
        }
        if (data.hasMore) {
            expect(data.items.length).toBeGreaterThan(0);
            expect(data.items.length).toBeLessThanOrEqual(data.limit);
        }
    }

    validateMeterDetails(data: DaywiseBillingData) {
        data.items.forEach((item) => {
            expect(item.slNo).toBeGreaterThan(0);
            expect(item.meterNumber).toBeTruthy();
            expect(item.phase).toBeTruthy();
            if (item.mf !== null && item.mf !== undefined) {
                expect(item.mf).toBeGreaterThan(0);
            }
            if (item.sanctionedLoadKw !== null && item.sanctionedLoadKw !== undefined) {
                expect(item.sanctionedLoadKw).toBeGreaterThanOrEqual(0);
            }
        });
    }

    validateConsumerData(data: DaywiseBillingData) {
        data.items.forEach((item) => {
            if (item.consumerName) {
                expect(item.consumerName.trim()).not.toEqual("");
            }
            if (item.consumerAddress) {
                expect(item.consumerAddress.trim()).not.toEqual("");
            }
            if (item.ivrsNumber) {
                expect(item.ivrsNumber.trim()).not.toEqual("");
            }
            if (item.tariff) {
                expect(item.tariff.trim()).not.toEqual("");
            }
        });
    }

    validateDailyKwhValues(data: DaywiseBillingData) {
        data.items.forEach((item) => {
            dailyReadings(item).forEach((value) => {
                if (value !== null) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            });
        });
    }

    /** Cumulative register: each day >= previous. Equal days (plateau) are valid. */
    validateDailyReadingTrend(data: DaywiseBillingData) {
        data.items.forEach((item) => {
            const readings = dailyReadings(item);
            for (let i = 1; i < readings.length; i++) {
                const previous = readings[i - 1];
                const current = readings[i];
                if (previous !== null && current !== null) {
                    expect(current).toBeGreaterThanOrEqual(previous);
                }
            }
        });
    }

    validateDaysInMonth(data: DaywiseBillingData) {
        const lastDay = daysInMonth(data.month, data.year);
        data.items.forEach((item) => {
            const readings = dailyReadings(item);
            for (let day = lastDay + 1; day <= 31; day++) {
                expect(readings[day - 1]).toBeNull();
            }
        });
    }

    /**
     * Duplicate slNo / meter / lookup / IVRS / row id is a fail.
     * Same feeder, DTR, zone, or tariff on many meters is valid.
     */
    validateUniqueReadings(data: DaywiseBillingData): void {
        const slNos = data.items.map((item) => item.slNo);
        const meters = data.items.map((item) => item.meterNumber);
        expect(new Set(slNos).size).toBe(slNos.length);
        expect(new Set(meters).size).toBe(meters.length);
        const lookups = data.items
            .filter((item) => item.meterLookupId != null)
            .map((item) => item.meterLookupId);
        expect(new Set(lookups).size).toBe(lookups.length);
        const ivrs = data.items
            .filter((item) => item.ivrsNumber)
            .map((item) => item.ivrsNumber);
        expect(new Set(ivrs).size).toBe(ivrs.length);
        const ids = data.items
            .filter((item) => item.id)
            .map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
    }

    validateDuplicateMeters(data: DaywiseBillingData) {
        this.validateUniqueReadings(data);
    }

    validateDuplicateSlNos(data: DaywiseBillingData) {
        const slNos = data.items.map((item) => item.slNo);
        const duplicates = slNos.filter(
            (value, index) => slNos.indexOf(value) !== index,
        );
        expect(duplicates.length).toBe(0);
    }

    validateSharedKeysAllowed(data: DaywiseBillingData): void {
        if (data.items.length < 2) {
            return;
        }
        const feeders = data.items.map((item) => item.feeder);
        const dtrs = data.items.map((item) => item.dtr);
        expect(new Set(feeders).size).toBeLessThanOrEqual(feeders.length);
        expect(new Set(dtrs).size).toBeLessThanOrEqual(dtrs.length);
    }

    validateMeterFilter(data: DaywiseBillingData, meterNumber: string) {
        data.items.forEach((item) => {
            expect(item.meterNumber).toBe(meterNumber);
        });
    }

    validatePageSerials(data: DaywiseBillingData) {
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

    validateNoDataScenario(data: DaywiseBillingData, includeTotal = false) {
        if (includeTotal && data.total === 0) {
            expect(data.items.length).toBe(0);
        }
    }

    validateNullSafeFields(data: DaywiseBillingData) {
        data.items.forEach((item) => {
            if (item.division !== null) {
                expect(typeof item.division).toBe("string");
            }
            if (item.zone !== null) {
                expect(typeof item.zone).toBe("string");
            }
            if (item.feeder !== null) {
                expect(typeof item.feeder).toBe("string");
            }
            if (item.dtr !== null) {
                expect(typeof item.dtr).toBe("string");
            }
        });
    }
}
