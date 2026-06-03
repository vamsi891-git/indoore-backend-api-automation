import { expect } from "@playwright/test";
export class TechnicalReportValidator {
    // =====================================
    // ROOT VALIDATIONS
    // =====================================
    validateResponseStructure(data: any): void {
        expect(data).toHaveProperty("analysisType");
        expect(data).toHaveProperty("reportName");
        expect(data).toHaveProperty("condition");
        expect(data).toHaveProperty("category");
        expect(data).toHaveProperty("month");
        expect(data).toHaveProperty("year");
        expect(data).toHaveProperty("page");
        expect(data).toHaveProperty("pageSize");
        expect(data).toHaveProperty("totalCount");
        expect(data).toHaveProperty("totalPages");
        expect(data).toHaveProperty("rows");
    }
    // =====================================
    // REQUEST ECHO
    // =====================================
    validateAnalysisType(actual: string, expected: string): void {
        expect(actual).toBe(expected);
    }
    validateMonth(actual: number,expected: number): void {
        expect(actual).toBe(expected);
    }
    validateYear(actual: number,expected: number): void {
        expect(actual).toBe(expected);  
    }
    // =====================================
    // PAGINATION
    // =====================================
    validatePagination(data: any): void {
        expect(data.page).toBeGreaterThan(0);
        expect(data.pageSize).toBeGreaterThan(0);
        expect(data.totalCount).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);
    }
    validatePaginationConsistency(data: any): void {
        expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
    }
    // =====================================
    // NO DATA
    // =====================================
    validateNoDataScenario(data: any): void {
        expect(Array.isArray(data.rows)).toBeTruthy();
        expect(data.rows.length).toBe(0);
        expect(data.totalCount).toBe(0);
    }
    // =====================================
    // ROW REQUIRED FIELDS
    // =====================================
    validateRowStructure(row: any ): void {
        expect(row).toHaveProperty("meterLookupId");
        expect(row).toHaveProperty("subDivision");
        expect(row).toHaveProperty("subStation");
        expect(row).toHaveProperty("feeder");
        expect(row).toHaveProperty("dtr");
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("address");
        expect(row).toHaveProperty("ivrsNumber");
        expect(row).toHaveProperty("category");
        expect(row).toHaveProperty("msn");
        expect(row).toHaveProperty("phase");
        expect(row).toHaveProperty("eventName");
    }
    // =====================================
    // TYPE VALIDATIONS
    // =====================================
    validateRowTypes(row: any): void {
        expect(typeof row.meterLookupId).toBe("number");
        expect(typeof row.subDivision).toBe("string");
        expect(typeof row.subStation).toBe("string");
        expect(typeof row.feeder).toBe("string");
        expect(typeof row.dtr).toBe("string");
        expect(typeof row.name).toBe("string");
        expect(typeof row.address).toBe("string");
        expect(typeof row.ivrsNumber).toBe("string");
        expect(typeof row.category).toBe("string");
        expect(typeof row.msn).toBe("string");
        expect(typeof row.phase).toBe("string");
        expect(typeof row.eventName).toBe("string");
    }
    // =====================================
    // NULL CHECKS
    // =====================================
    validateNulls(row: any): void {
        expect(row.meterLookupId).not.toBeNull();
        expect(row.subDivision).not.toBeNull();
        expect(row.subStation).not.toBeNull();
        expect(row.feeder).not.toBeNull();
        expect(row.dtr).not.toBeNull();
        expect(row.name).not.toBeNull();
        expect(row.ivrsNumber).not.toBeNull();
        expect(row.msn).not.toBeNull();
        expect(row.eventName).not.toBeNull();
    }
    // =====================================
    // UNDEFINED CHECKS
    // =====================================
    validateUndefined(row: any): void {
        Object.values(row).forEach(value => {
                expect(value).not.toBeUndefined();
            });
    }
    // =====================================
    // EMPTY STRING CHECKS
    // =====================================
    validateEmptyStrings(row: any): void {
        expect(String(row.msn ?? "").trim().length).toBeGreaterThan(0);
    }

    // =====================================
    // NAN CHECKS
    // =====================================

    validateNaN(row: any): void {
        expect(Number.isNaN(row.meterLookupId)).toBeFalsy();
        if (row.durationInHours !==undefined) 
        {
            expect(Number.isNaN(row.durationInHours)).toBeFalsy();
        }
    }
    // =====================================
    // DUPLICATE CHECKS
    // =====================================
    validateDuplicateMeterIds(rows: any[]): void {
        const ids =rows.map(row => row.meterLookupId);
        expect(new Set(ids).size).toBe(ids.length);
    }
    validateDuplicateMSN(rows: any[]): void {
        const values =rows.map(row => row.msn);
        expect(new Set(values).size).toBe(values.length);
    }
    validateDuplicateIVRS(rows: any[]): void {
        const values =rows.map(row => row.ivrsNumber);
        expect(new Set(values).size).toBe(values.length);
    }
    validateDuplicateMeterEvent( rows: any[] ): void {
        const values =rows.map(row =>`${row.meterLookupId}_${row.eventName}`);
        expect(new Set(values).size).toBe(values.length);
    }
    validateDuplicateRows(rows: any[]): void {
        const values =rows.map(row =>JSON.stringify(row));
        expect(new Set(values).size).toBe(values.length);
    }
    // =====================================
    // BUSINESS RULES
    // =====================================
    validateDuration100(rows: any[]): void {this.validateMinDurationHours(rows, 100) }
    validateDuration12(rows: any[]): void {this.validateMinDurationHours(rows, 12);}
    validateDuration10(rows: any[]): void {this.validateMinDurationHours(rows, 10);}
    validateMinDurationHours(rows: any[], minHours: number): void {
        rows.forEach(row => {
            expect(row.durationInHours).toBeGreaterThanOrEqual(minHours);
        });
    }
    validateDurationType(rows: any[]): void {
        rows.forEach(row => {
            expect(typeof row.durationInHours).toBe("number");
            expect(row.durationInHours).toBeGreaterThan(0);
        });
    }
    validateCountReport(rows: any[]): void {
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach(row => {
            expect(row.eventName).toBeTruthy();
        });
    }
    // =====================================
    // CROSS FIELD
    // =====================================
    validateCrossFieldLogic(data: any): void {
        if (data.totalCount > 0 ) {
            expect(data.rows.length).toBeGreaterThan(0);
        }
        if (data.totalPages === 1) {
            expect(data.page).toBe(1);
        }
    }
}