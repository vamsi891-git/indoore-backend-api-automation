import { expect } from "@playwright/test";
import {
    DtrBillingReportData,
    DtrBillingResponse,
    DtrBillingRow,
} from "../Mapper/dtrbilling.mapper";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DMY_DATE_TIME = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;

function parseIsoDate(value: string): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function parseDmyDateTime(value: string): Date {
    const [datePart, timePart] = value.split(" ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute);
}

function parseNumericString(value: string): number {
    return Number.parseFloat(value);
}

export class DtrBillingValidator {
    validateSuccess(response: DtrBillingResponse) {
        expect(response.success).toBeTruthy();
    }

    validateRootStructure(response: DtrBillingResponse) {
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data.rows)).toBeTruthy();
        expect(response.data.appliedFilters).toBeDefined();
    }

    validateQueryEcho(
        data: DtrBillingReportData,
        fromDate: string,
        toDate: string,
        page: number,
        limit: number,
    ) {
        expect(data.fromDate).toBe(fromDate);
        expect(data.toDate).toBe(toDate);
        expect(data.page).toBe(page);
        expect(data.limit).toBe(limit);
    }

    validateDateRangeFormat(data: DtrBillingReportData) {
        expect(ISO_DATE.test(data.fromDate)).toBeTruthy();
        expect(ISO_DATE.test(data.toDate)).toBeTruthy();
        expect(parseIsoDate(data.fromDate).getTime()).toBeLessThanOrEqual(
            parseIsoDate(data.toDate).getTime(),
        );
    }

    validatePagination(data: DtrBillingReportData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.limit);

        if (data.total > 0) {
            expect(data.totalPages).toBe(
                Math.ceil(data.total / data.limit),
            );
        }
    }

    validateIncludeTotalFlag(
        data: DtrBillingReportData,
        includeTotal: boolean,
    ) {
        if (!includeTotal) {
            expect(data.totalIsExact).toBeFalsy();
        }
    }

    validateScopeMetadata(data: DtrBillingReportData) {
        expect(data.scopeMeterCount).toBeGreaterThanOrEqual(0);
        expect(typeof data.scopeTruncated).toBe("boolean");

        if (data.total > 0) {
            expect(data.scopeMeterCount).toBeGreaterThanOrEqual(data.total);
        }
    }

    validateAppliedFilters(data: DtrBillingReportData) {
        const filters = data.appliedFilters;
        expect(filters).toHaveProperty("organisationLookupId");
        expect(filters).toHaveProperty("networkLookupId");
        expect(filters).toHaveProperty("dtrTypeTblRefId");
        expect(filters).toHaveProperty("dtrRatingTblRefId");
        expect(filters).toHaveProperty("meterNumber");

        for (const key of [
            "organisationLookupId",
            "networkLookupId",
            "dtrTypeTblRefId",
            "dtrRatingTblRefId",
        ] as const) {
            const value = filters[key];
            expect(value === null || typeof value === "number").toBeTruthy();
        }

        expect(
            filters.meterNumber === null || typeof filters.meterNumber === "string",
        ).toBeTruthy();
    }

    validateRowsStructure(rows: DtrBillingRow[]) {
        for (const row of rows) {
            expect(typeof row.slNo).toBe("number");
            expect(typeof row.circle).toBe("string");
            expect(typeof row.division).toBe("string");
            expect(typeof row.zone).toBe("string");
            expect(typeof row.subStation).toBe("string");
            expect(typeof row.feeder).toBe("string");
            expect(typeof row.dtr).toBe("string");
            expect(typeof row.meterSerialNumber).toBe("string");
            expect(typeof row.meterTime).toBe("string");
            expect(typeof row.billingDate).toBe("string");
            expect(typeof row.kwhImp).toBe("string");
            expect(typeof row.kwhExp).toBe("string");
            expect(typeof row.kvahImp).toBe("string");
            expect(typeof row.kvahExp).toBe("string");
            expect(typeof row.kwImp).toBe("string");
            expect(typeof row.kvaImp).toBe("string");
            expect(typeof row.mf).toBe("string");
            expect(
                row.kwDateTime === null || typeof row.kwDateTime === "string",
            ).toBeTruthy();
            expect(
                row.kvaDateTime === null || typeof row.kvaDateTime === "string",
            ).toBeTruthy();
        }
    }

    validateHierarchyFields(rows: DtrBillingRow[]) {
        for (const row of rows) {
            expect(row.circle.trim()).not.toEqual("");
            expect(row.division.trim()).not.toEqual("");
            expect(row.zone.trim()).not.toEqual("");
            expect(row.subStation.trim()).not.toEqual("");
            expect(row.feeder.trim()).not.toEqual("");
            expect(row.dtr.trim()).not.toEqual("");
        }
    }

    validateMeterSerialNumber(rows: DtrBillingRow[]) {
        for (const row of rows) {
            expect(row.meterSerialNumber.trim()).not.toEqual("");
            expect(/^\d+$/.test(row.meterSerialNumber.trim())).toBeTruthy();
        }
    }

    validateDateTimeFormat(rows: DtrBillingRow[]) {
        for (const row of rows) {
            expect(DMY_DATE_TIME.test(row.meterTime)).toBeTruthy();
            expect(DMY_DATE_TIME.test(row.billingDate)).toBeTruthy();

            if (row.kwDateTime != null) {
                expect(DMY_DATE_TIME.test(row.kwDateTime)).toBeTruthy();
            }

            if (row.kvaDateTime != null) {
                expect(DMY_DATE_TIME.test(row.kvaDateTime)).toBeTruthy();
            }
        }
    }

    validateBillingDateInRange(
        rows: DtrBillingRow[],
        fromDate: string,
        toDate: string,
    ) {
        const start = parseIsoDate(fromDate);
        const end = parseIsoDate(toDate);
        end.setHours(23, 59, 59, 999);

        for (const row of rows) {
            const billing = parseDmyDateTime(row.billingDate);
            expect(billing.getTime()).toBeGreaterThanOrEqual(start.getTime());
            expect(billing.getTime()).toBeLessThanOrEqual(end.getTime());
        }
    }

    validateEnergyFields(rows: DtrBillingRow[]) {
        for (const row of rows) {
            for (const field of [
                row.kwhImp,
                row.kwhExp,
                row.kvahImp,
                row.kvahExp,
                row.kwImp,
                row.kvaImp,
            ]) {
                const value = parseNumericString(field);
                expect(Number.isNaN(value)).toBeFalsy();
                expect(value).toBeGreaterThanOrEqual(0);
            }
        }
    }

    validateElectricalBusinessRules(rows: DtrBillingRow[]) {
        for (const row of rows) {
            const kwhImp = parseNumericString(row.kwhImp);
            const kvahImp = parseNumericString(row.kvahImp);
            const kwImp = parseNumericString(row.kwImp);
            const kvaImp = parseNumericString(row.kvaImp);

            expect(kvahImp).toBeGreaterThanOrEqual(kwhImp);
            expect(kvaImp).toBeGreaterThanOrEqual(kwImp);
        }
    }

    validateExportEnergy(rows: DtrBillingRow[]) {
        for (const row of rows) {
            expect(parseNumericString(row.kwhExp)).toBeGreaterThanOrEqual(0);
            expect(parseNumericString(row.kvahExp)).toBeGreaterThanOrEqual(0);
        }
    }

    validateMf(rows: DtrBillingRow[]) {
        for (const row of rows) {
            const mf = parseNumericString(row.mf);
            expect(Number.isNaN(mf)).toBeFalsy();
            expect(mf).toBeGreaterThan(0);
        }
    }

    validateSlNoSequence(rows: DtrBillingRow[], page: number, limit: number) {
        const expectedStart = (page - 1) * limit + 1;

        rows.forEach((row, index) => {
            expect(row.slNo).toBe(expectedStart + index);
        });
    }

    validateUniqueSlNo(rows: DtrBillingRow[]) {
        const slNos = rows.map((row) => row.slNo);
        expect(new Set(slNos).size).toBe(slNos.length);
    }

    validateUniqueMeterSerial(rows: DtrBillingRow[]) {
        const serials = rows.map((row) => row.meterSerialNumber);
        expect(new Set(serials).size).toBe(serials.length);
    }

    validateNoDataScenario(data: DtrBillingReportData) {
        if (data.total === 0) {
            expect(data.rows.length).toBe(0);
            expect(data.totalPages).toBe(0);
        }
    }

    validateRowsPresentWhenTotalPositive(data: DtrBillingReportData) {
        if (data.total > 0) {
            expect(data.rows.length).toBeGreaterThan(0);
        }
    }
}
