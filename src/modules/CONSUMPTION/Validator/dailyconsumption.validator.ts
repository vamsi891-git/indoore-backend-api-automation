import { expect } from "@playwright/test";
import {
    DailyConsumptionData,
    DailyConsumptionItem,
} from "../Mapper/dailyconsumption.mapper";

const ITEM_REQUIRED_FIELDS = [
    "slNo",
    "division",
    "zone",
    "subStation",
    "feeder",
    "dtr",
    "name",
    "ivrsNumber",
    "msn",
    "phase",
    "serviceDate",
    "minDate",
    "maxDate",
    "ir",
    "fr",
    "kwh",
] as const;

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function round5(n: number): number {
    return Number(n.toFixed(5));
}

function hasAtMost5Decimals(n: number): boolean {
    return round5(n) === n;
}

export class DailyConsumptionValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: DailyConsumptionData) {
        expect(Array.isArray(data.items)).toBeTruthy();
        expect(typeof data.total).toBe("number");
        expect(typeof data.page).toBe("number");
        expect(typeof data.limit).toBe("number");
        expect(typeof data.totalPages).toBe("number");
    }

    validateQueryEcho(data: DailyConsumptionData, page: number, limit: number) {
        expect(data.page).toBe(page);
        expect(data.limit).toBe(limit);
    }

    validatePaginationBounds(data: DailyConsumptionData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.items.length).toBeLessThanOrEqual(data.limit);
    }

    validatePaginationMath(data: DailyConsumptionData) {
        if (data.total === 0) {
            expect(data.items.length).toBe(0);
            expect(data.totalPages).toBe(0);
            return;
        }

        const expectedPages = Math.ceil(data.total / data.limit);
        expect(data.totalPages).toBe(expectedPages);
        expect(data.total).toBeGreaterThanOrEqual(data.items.length);
    }

    validateItemsPresentWhenTotalPositive(data: DailyConsumptionData) {
        if (data.total > 0 && data.page === 1) {
            expect(data.items.length).toBeGreaterThan(0);
        }
    }

    validateItemRequiredFields(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            ITEM_REQUIRED_FIELDS.forEach((field) => {
                expect(item).toHaveProperty(field);
            });
        });
    }

    validateItemStructure(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            expect(typeof item.slNo).toBe("number");
            expect(item.slNo).toBeGreaterThan(0);
            expect(
                item.division === null || typeof item.division === "string",
            ).toBeTruthy();
            expect(item.zone === null || typeof item.zone === "string").toBeTruthy();
            expect(
                item.subStation === null || typeof item.subStation === "string",
            ).toBeTruthy();
            expect(
                item.feeder === null || typeof item.feeder === "string",
            ).toBeTruthy();
            expect(item.dtr === null || typeof item.dtr === "string").toBeTruthy();
            expect(item.name === null || typeof item.name === "string").toBeTruthy();
            expect(
                item.ivrsNumber === null || typeof item.ivrsNumber === "string",
            ).toBeTruthy();
            expect(item.msn === null || typeof item.msn === "string").toBeTruthy();
            expect(item.phase === null || typeof item.phase === "string").toBeTruthy();
            expect(
                item.serviceDate === null || typeof item.serviceDate === "string",
            ).toBeTruthy();
            expect(
                item.minDate === null || typeof item.minDate === "string",
            ).toBeTruthy();
            expect(
                item.maxDate === null || typeof item.maxDate === "string",
            ).toBeTruthy();
            expect(item.ir === null || typeof item.ir === "number").toBeTruthy();
            expect(item.fr === null || typeof item.fr === "number").toBeTruthy();
            expect(item.kwh === null || typeof item.kwh === "number").toBeTruthy();
        });
    }

    validateSerialSequence(
        items: DailyConsumptionItem[],
        page: number,
        limit: number,
    ) {
        const base = (page - 1) * limit;
        items.forEach((item, index) => {
            expect(item.slNo).toBe(base + index + 1);
        });
    }

    validateUniqueSerialNumbers(items: DailyConsumptionItem[]) {
        const serials = items.map((item) => item.slNo);
        expect(new Set(serials).size).toBe(serials.length);
    }

    validateReadingDateFormat(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            if (item.minDate) {
                expect(ISO_DATE_TIME.test(item.minDate)).toBeTruthy();
            }
            if (item.maxDate) {
                expect(ISO_DATE_TIME.test(item.maxDate)).toBeTruthy();
            }
        });
    }

    validateNullReadingBundle(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            if (item.ir === null && item.fr === null) {
                expect(item.kwh).toBeNull();
                expect(item.minDate).toBeNull();
                expect(item.maxDate).toBeNull();
            }
        });
    }

    validateKwhDerivation(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            if (item.ir == null || item.fr == null) {
                expect(item.kwh).toBeNull();
                return;
            }
            expect(item.kwh).not.toBeNull();
            expect(item.kwh).toBe(round5(item.fr! - item.ir!));
        });
    }

    validateRound5Precision(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            for (const value of [item.ir, item.fr, item.kwh]) {
                if (value == null) {
                    continue;
                }
                expect(hasAtMost5Decimals(value)).toBeTruthy();
            }
        });
    }

    validateNonNegativeReadings(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            for (const value of [item.ir, item.fr, item.kwh]) {
                if (value == null) {
                    continue;
                }
                expect(value).toBeGreaterThanOrEqual(0);
            }
        });
    }

    validateReadingDatesWhenPresent(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            if (item.ir == null && item.fr == null) {
                return;
            }
            expect(item.minDate).toBeTruthy();
            expect(item.maxDate).toBeTruthy();
        });
    }

    validateMsnWhenPresent(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            if (item.msn == null) {
                return;
            }
            expect(item.msn.trim().length).toBeGreaterThan(0);
        });
    }

    validateNoNaN(items: DailyConsumptionItem[]) {
        items.forEach((item) => {
            for (const value of [item.ir, item.fr, item.kwh, item.slNo]) {
                if (typeof value === "number") {
                    expect(Number.isNaN(value)).toBeFalsy();
                }
            }
        });
    }

    validateBusinessRules(data: DailyConsumptionData) {
        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("total");
        expect(data).toHaveProperty("page");
        expect(data).toHaveProperty("limit");
        expect(data).toHaveProperty("totalPages");
    }
}
