import { expect } from "@playwright/test";
import type {
  TechnicalReportMapped,
  TechnicalReportRow,
} from "../Mapper/technicalanalysis.mapper";
import type { TechnicalReportScenario } from "../Data/technicalanalysis.data";
import {
  EXPECTED_TECHNICAL_DURATION_COLUMNS,
  EXPECTED_TECHNICAL_EVENT_COLUMNS,
  EXPECTED_TECHNICAL_YNR_DURATION_COLUMNS,
} from "../Data/technicalanalysis.data";

export function normalizeTechnicalMsn(value: unknown): string {
  const raw = String(value ?? "").trim();
  const stripped = raw.replace(/^0+/, "");
  return stripped || raw.toLowerCase();
}

export function normalizeTechnicalDtr(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function formatTechnicalMetricKey(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value ?? "").trim();
}

export function technicalRowMetricKey(row: TechnicalReportRow): string {
  return [
    formatTechnicalMetricKey(row.durationInHours),
    formatTechnicalMetricKey((row as { eventCount?: number }).eventCount),
    String(row.eventName ?? "").trim(),
  ].join("|");
}

/**
 * Same meter on two DTRs is allowed. Same meterLookupId + DTR (or MSN + DTR + value) is a duplicate.
 */
export function validateNoDuplicateTechnicalMeterRows(
  rows: TechnicalReportRow[],
  reportLabel = "Technical Report",
): void {
  const seen = new Map<string, TechnicalReportRow>();
  const seenIds = new Map<string, TechnicalReportRow>();

  for (const row of rows) {
    const key = `${row.meterLookupId}-${normalizeTechnicalMsn(row.msn)}-${normalizeTechnicalDtr(row.dtr)}`;
    const rowId = String(row.id ?? "").trim();
    expect(seen.has(key), `Duplicate ${reportLabel} record: ${key}`).toBeFalsy();
    seen.set(key, row);
    if (rowId) {
      const idKey = `${rowId}|${normalizeTechnicalDtr(row.dtr)}`;
      expect(
        seenIds.has(idKey),
        `Duplicate ${reportLabel} id=${rowId} dtr=${normalizeTechnicalDtr(row.dtr) || "(blank)"}`,
      ).toBeFalsy();
      seenIds.set(idKey, row);
    }
  }
}

/**
 * Phase grids use slNo / IVRS / meterSerialNumber (often no meterLookupId or msn).
 * Same IVRS on two DTRs is allowed. Same IVRS + DTR is a duplicate.
 */
export function validateNoDuplicatePhaseRows(
  rows: TechnicalReportRow[],
  reportLabel = "Phase Report",
): void {
  const seenIvrsDtr = new Map<string, TechnicalReportRow>();
  const seenSerialDtr = new Map<string, TechnicalReportRow>();
  const seenSlNo = new Set<string>();

  for (const row of rows) {
    const slNo = String((row as { slNo?: unknown }).slNo ?? "").trim();
    if (slNo) {
      expect(
        seenSlNo.has(slNo),
        `Duplicate ${reportLabel} slNo=${slNo}`,
      ).toBeFalsy();
      seenSlNo.add(slNo);
    }

    const ivrs = String(row.ivrsNumber ?? "").trim();
    const dtr = normalizeTechnicalDtr(row.dtr);
    expect(ivrs, `${reportLabel}: ivrsNumber must be non-blank`).toBeTruthy();
    const ivrsKey = `${ivrs}|${dtr}`;
    expect(
      seenIvrsDtr.has(ivrsKey),
      `Duplicate ${reportLabel} ivrs=${ivrs} dtr=${dtr || "(blank)"}`,
    ).toBeFalsy();
    seenIvrsDtr.set(ivrsKey, row);

    const serial = String(
      (row as { meterSerialNumber?: unknown }).meterSerialNumber ??
        row.msn ??
        "",
    ).trim();
    if (!serial) {
      continue;
    }
    const serialKey = `${normalizeTechnicalMsn(serial)}|${dtr}`;
    expect(
      seenSerialDtr.has(serialKey),
      `Duplicate ${reportLabel} serial=${serial} dtr=${dtr || "(blank)"}`,
    ).toBeFalsy();
    seenSerialDtr.set(serialKey, row);
  }
}

export function validateUniqueTechnicalMeterIdentity(
  rows: TechnicalReportRow[],
  reportLabel = "Technical Report",
): void {
  const byLookupDtr = new Map<string, TechnicalReportRow>();
  const byMsnMetric = new Map<string, TechnicalReportRow>();

  for (const row of rows) {
    const lookupId = Number(row.meterLookupId);
    const msn = normalizeTechnicalMsn(row.msn);
    const dtr = normalizeTechnicalDtr(row.dtr);
    const metricKey = technicalRowMetricKey(row);
    expect(lookupId, `${reportLabel}: meterLookupId must be > 0`).toBeGreaterThan(0);
    expect(msn, `${reportLabel}: msn must be non-blank`).toBeTruthy();
    const lookupKey = `${lookupId}|${dtr}`;
    expect(
      byLookupDtr.has(lookupKey),
      `Duplicate ${reportLabel} meterLookupId=${lookupId} dtr=${dtr || "(blank)"}`,
    ).toBeFalsy();
    byLookupDtr.set(lookupKey, row);
    const msnKey = `${msn}|${dtr}|${metricKey}`;
    expect(
      byMsnMetric.has(msnKey),
      `Duplicate ${reportLabel} msn=${msn} dtr=${dtr || "(blank)"} with same value=${metricKey}`,
    ).toBeFalsy();
    byMsnMetric.set(msnKey, row);
  }
}

export interface TechnicalAnalysisErrorBody {
  success: boolean;
  error?: { code?: string; message?: string };
}

export class TechnicalReportValidator {
    // =====================================
    // ROOT VALIDATIONS
    // =====================================
    validateResponseStructure(data: any): void {
        expect(data).toHaveProperty("analysisType");
        expect(data).toHaveProperty("category");
        expect(data).toHaveProperty("month");
        expect(data).toHaveProperty("year");
        expect(data).toHaveProperty("page");
        expect(data).toHaveProperty("pageSize");
        expect(data).toHaveProperty("totalCount");
        expect(data).toHaveProperty("totalPages");
        expect(Array.isArray(data.rows)).toBeTruthy();
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

        if (data.totalCount === 0) {
            expect(data.totalPages).toBe(0);
            expect(data.rows.length).toBe(0);
            return;
        }

        expect(data.totalPages).toBeGreaterThan(0);
        const expectedTotalPages = Math.max(
            1,
            Math.ceil(data.totalCount / data.pageSize),
        );
        expect(data.totalPages).toBe(expectedTotalPages);
    }
    validatePaginationConsistency(data: any): void {
        expect(data.totalCount).toBeGreaterThanOrEqual(data.rows.length);
    }
    /** Cursor-based phase reports may omit total/totalPages. */
    validatePhasePagination(data: any): void {
        expect(data.page).toBeGreaterThan(0);
        expect(data.pageSize).toBeGreaterThan(0);
        expect(data.rows.length).toBeLessThanOrEqual(data.pageSize);
        expect(data.rows.length).toBeGreaterThan(0);
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
    validateDuplicateMeterIds(rows: TechnicalReportRow[]): void {
        validateNoDuplicateTechnicalMeterRows(rows);
    }
    validateDuplicateMSN(rows: TechnicalReportRow[]): void {
        validateUniqueTechnicalMeterIdentity(rows);
    }
    validateDuplicateIVRS(rows: TechnicalReportRow[]): void {
        validateUniqueTechnicalMeterIdentity(rows);
    }
    validateDuplicateMeterEvent(rows: TechnicalReportRow[]): void {
        validateUniqueTechnicalMeterIdentity(rows);
    }
    validateDuplicateRows(rows: TechnicalReportRow[]): void {
        const values = rows.map((row) => JSON.stringify(row));
        expect(new Set(values).size).toBe(values.length);
    }
    /** Same meter on two DTRs is allowed. Same meter + DTR + value is a duplicate. */
    validateDuplicateContract(rows: TechnicalReportRow[]): void {
        validateNoDuplicateTechnicalMeterRows(rows);
        validateUniqueTechnicalMeterIdentity(rows);
        this.validateDuplicateRows(rows);
    }
    validateDurationColumns(
        columns: Array<{ key: string; header: string }> | undefined,
        includeDurationHours = true,
        ynrDuration = false,
    ): void {
        if (!columns?.length) {
            return;
        }
        if (ynrDuration) {
            expect(columns).toEqual(EXPECTED_TECHNICAL_YNR_DURATION_COLUMNS);
            return;
        }
        expect(columns).toEqual(
          includeDurationHours
            ? EXPECTED_TECHNICAL_DURATION_COLUMNS
            : EXPECTED_TECHNICAL_EVENT_COLUMNS,
        );
    }
    validateZoneColumn(
        columns: Array<{ key: string; header: string }> | undefined,
    ): void {
        if (!columns?.length) {
            return;
        }
        expect(columns[0]?.key).toBe("subDivision");
        expect(columns[0]?.header).toBe("Zone");
    }
    validatePhaseColumns(
        columns: Array<{ key: string; header: string }> | undefined,
    ): void {
        if (!columns?.length) {
            return;
        }
        expect(columns[0]?.key).toBe("slNo");
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
    validatePhaseReport(rows: any[]): void {
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach((row) => {
            expect(String(row.ivrsNumber ?? "").trim().length).toBeGreaterThan(0);
            expect(row.eventCount ?? row.durationHhMm ?? row.maxIR).toBeDefined();
        });
        validateNoDuplicatePhaseRows(rows);
    }
    // =====================================
    // CROSS FIELD
    // =====================================
    validateCrossFieldLogic(data: any): void {
        if (data.totalCount > 0) {
            const offset = (data.page - 1) * data.pageSize;
            if (data.totalCount <= offset) {
                expect(data.rows.length).toBe(0);
                return;
            }
            expect(data.rows.length).toBeGreaterThan(0);
        }
        if (data.totalPages === 1) {
            expect(data.page).toBe(1);
        }
    }

    validateValidationError(responseBody: TechnicalAnalysisErrorBody): void {
        expect(responseBody.success).toBeFalsy();
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
        expect(responseBody.error?.message).toBeTruthy();
    }

    validateScenario(
        mapped: TechnicalReportMapped,
        scenario: TechnicalReportScenario,
        queryPage?: number,
    ): void {
        switch (scenario) {
            case "dev_page_beyond":
                expect(mapped.page).toBe(queryPage ?? mapped.page);
                if (mapped.totalCount > 0) {
                    expect(mapped.rows.length).toBe(0);
                }
                break;
            case "dev_custom_page_size":
                expect(mapped.pageSize).toBeGreaterThan(0);
                expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pageSize);
                break;
            case "dev_category_domestic":
            case "dev_category_non_domestic":
                expect(mapped.category).toBeTruthy();
                break;
            case "contract_empty_page":
                expect(mapped.totalCount).toBe(0);
                expect(mapped.rows.length).toBe(0);
                expect(mapped.totalPages).toBe(0);
                break;
            case "contract_duration_row":
                expect(mapped.rows.length).toBe(1);
                expect(mapped.rows[0]?.durationInHours).toBeGreaterThanOrEqual(100);
                break;
            default:
                break;
        }
    }
}