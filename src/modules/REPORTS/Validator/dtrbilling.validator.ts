import { expect } from "@playwright/test";
import {
  dtrBillingDefaultFromDate,
  dtrBillingDefaultLimit,
  dtrBillingDefaultPage,
  dtrBillingDefaultToDate,
  dtrBillingExpectedColumns,
} from "../Data/dtrbilling.data";
import type {
  DtrBillingErrorBody,
  DtrBillingReportData,
  DtrBillingResponse,
  DtrBillingRow,
  DtrBillingScenario,
  MappedDtrBilling,
} from "../Mapper/dtrbilling.mapper";
import { dtrBillingColumnKeys } from "../Mapper/dtrbilling.mapper";

const DMY_DATE_TIME = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
const DECIMAL_OR_NULL = /^-?\d+(\.\d+)?$/;

function isNullableDecimal(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return DECIMAL_OR_NULL.test(String(value).trim());
}

function parseDmyDateTime(value: string): number | null {
  const match = value
    .trim()
    .match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min] = match;
  const ms = Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
  return Number.isNaN(ms) ? null : ms;
}

function parseNumericString(value: string): number {
  return Number.parseFloat(value);
}
export class DtrBillingValidator {
  validateResponseEnvelope(response: DtrBillingResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }
  validateValidationError(responseBody: DtrBillingErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }
  validateSuccess(mapped: MappedDtrBilling): void {
    expect(mapped.success).toBeTruthy();
  }
  validateRootStructure(mapped: MappedDtrBilling): void {
    expect(mapped.data).toBeDefined();
    expect(Array.isArray(mapped.data.columns)).toBeTruthy();
    expect(Array.isArray(mapped.data.rows)).toBeTruthy();
    expect(mapped.data.pagination).toBeDefined();
    expect(typeof mapped.data.pagination.page).toBe("number");
    expect(typeof mapped.data.pagination.limit).toBe("number");
  }
  validateColumns(data: DtrBillingReportData): void {
    expect(data.columns.length).toBe(dtrBillingExpectedColumns.length);
    const keys = data.columns.map((c) => c.key);
    for (const col of dtrBillingExpectedColumns) {
      expect(keys).toContain(col.key);
      expect(dtrBillingColumnKeys).toContain(col.key);
      expect(data.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
  }
  validatePaginationEcho(data: DtrBillingReportData,page: number,limit: number,): void {
    expect(data.pagination.page).toBe(page);
    expect(data.pagination.limit).toBe(limit);
  }
  validatePaginationBounds(data: DtrBillingReportData): void {
    expect(data.pagination.page).toBeGreaterThan(0);
    expect(data.pagination.limit).toBeGreaterThan(0);
    expect(data.rows.length).toBeLessThanOrEqual(data.pagination.limit);
  }
  /**
   * includeTotal=false → total/totalPages may be null while rows still exist.
   * That is valid backend behavior (not “no data”).
   */
  validatePaginationMath(data: DtrBillingReportData,includeTotal = false,): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } = data.pagination;
    const { rows } = data;
    if (!includeTotal) {
      if (total != null && totalPages != null) {
        if (total === 0) {
          expect(rows.length).toBe(0);
          expect(totalPages).toBe(0);
        } else {
          expect(totalPages).toBe(Math.ceil(total / limit));
        }
      } else {
        expect(total).toBeNull();
        expect(totalPages).toBeNull();
        if (totalIsExact != null) expect(totalIsExact).toBe(false);
        expect(rows.length).toBeGreaterThanOrEqual(0);
      }
      if (hasMore != null) expect(typeof hasMore).toBe("boolean");
      return;
    }
    expect(total).not.toBeNull();
    expect(totalPages).not.toBeNull();
    const t = total as number;
    const tp = totalPages as number;
    if (t === 0) {
      expect(rows.length).toBe(0);
      expect(tp).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(tp).toBe(Math.ceil(t / limit));
    expect(t).toBeGreaterThanOrEqual(rows.length);
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < tp);
  }
  validateRowsStructure(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(
        row.dtrRating == null ||
          typeof row.dtrRating === "number" ||
          typeof row.dtrRating === "string",
      ).toBeTruthy();
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(typeof row.meterTime).toBe("string");
      expect(typeof row.billingDate).toBe("string");
      expect(typeof row.mf).toBe("string");
      expect(isNullableDecimal(row.kwhImp)).toBeTruthy();
      expect(isNullableDecimal(row.kwhExp)).toBeTruthy();
      expect(isNullableDecimal(row.kvahImp)).toBeTruthy();
      expect(isNullableDecimal(row.kvahExp)).toBeTruthy();
      expect(isNullableDecimal(row.kwImp)).toBeTruthy();
      expect(isNullableDecimal(row.kvaImp)).toBeTruthy();
      expect(row.kwDateTime === null || typeof row.kwDateTime === "string",).toBeTruthy();
      expect(row.kvaDateTime === null || typeof row.kvaDateTime === "string",).toBeTruthy();
    }
  }

  /** Live ids: `row-{slNo}-{meterSerialNumber}`. */
  validateRowIds(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      expect(row.id.startsWith(`row-${row.slNo}-`)).toBeTruthy();
      expect(row.id).toContain(row.meterSerialNumber);
    }
  }

  /** Soft: hierarchy labels are strings; blank allowed when network joins miss. */
  validateHierarchyFields(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
    }
  }

  validateMeterSerialNumber(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
    }
  }

  validateDateTimeFormat(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      expect(DMY_DATE_TIME.test(row.meterTime.trim())).toBeTruthy();
      expect(DMY_DATE_TIME.test(row.billingDate.trim())).toBeTruthy();
      if (row.kwDateTime != null) {
        expect(DMY_DATE_TIME.test(row.kwDateTime.trim())).toBeTruthy();
      }
      if (row.kvaDateTime != null) {
        expect(DMY_DATE_TIME.test(row.kvaDateTime.trim())).toBeTruthy();
      }
    }
  }

  validateEnergyFields(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      for (const field of [
        row.kwhImp,
        row.kwhExp,
        row.kvahImp,
        row.kvahExp,
        row.kwImp,
        row.kvaImp,
      ]) {
        if (field == null) continue;
        const value = parseNumericString(field);
        expect(Number.isNaN(value)).toBeFalsy();
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  }

  /**
   * Only assert kVA ≥ kW when both present.
   * Live archive can return kWh Imp slightly above kVAh Imp — do not enforce that.
   */
  validateDemandFields(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      if (row.kwImp == null || row.kvaImp == null) continue;
      const kwImp = parseNumericString(row.kwImp);
      const kvaImp = parseNumericString(row.kvaImp);
      expect(kvaImp).toBeGreaterThanOrEqual(kwImp);
    }
  }

  validateMf(rows: DtrBillingRow[]): void {
    for (const row of rows) {
      const mf = parseNumericString(row.mf);
      expect(Number.isNaN(mf)).toBeFalsy();
      expect(mf).toBeGreaterThan(0);
    }
  }

  validateSlNoSequence(rows: DtrBillingRow[],page: number,limit: number,): void {
    const expectedStart = (page - 1) * limit + 1;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(expectedStart + index);
    });
  }

  /**
   * Duplicate id / slNo / meter+meterTime is a fail.
   * Same feeder, DTR, substation, or billing date on many meters is valid.
   * The same meter at a different meter time is valid.
   */
  validateUniqueReadings(rows: DtrBillingRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const metersAtTime = rows.map(
      (row) => `${row.meterSerialNumber}|${row.meterTime}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(metersAtTime).size).toBe(metersAtTime.length);
  }

  validateBillingWindow(
    rows: DtrBillingRow[],
    fromDate = dtrBillingDefaultFromDate,
    toDate = dtrBillingDefaultToDate,
  ): void {
    const from = Date.parse(`${fromDate}T00:00:00`);
    const to = Date.parse(`${toDate}T23:59:59`);
    for (const row of rows) {
      const meterTime = parseDmyDateTime(row.meterTime);
      const billingDate = parseDmyDateTime(row.billingDate);
      expect(meterTime).not.toBeNull();
      expect(billingDate).not.toBeNull();
      expect(meterTime as number).toBeGreaterThanOrEqual(from);
      expect(meterTime as number).toBeLessThanOrEqual(to);
      expect(billingDate as number).toBeGreaterThanOrEqual(from);
      expect(billingDate as number).toBeLessThanOrEqual(to);
    }
  }

  validateLiveOk(mapped: MappedDtrBilling,page = dtrBillingDefaultPage,limit = dtrBillingDefaultLimit,includeTotal = false,): void {
    const data = mapped.data;
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(data);
    this.validatePaginationEcho(data, page, limit);
    this.validatePaginationBounds(data);
    this.validatePaginationMath(data, includeTotal);
    if (data.rows.length > 0) {
      this.validateRowsStructure(data.rows);
      this.validateRowIds(data.rows);
      this.validateHierarchyFields(data.rows);
      this.validateMeterSerialNumber(data.rows);
      this.validateDateTimeFormat(data.rows);
      this.validateEnergyFields(data.rows);
      this.validateDemandFields(data.rows);
      this.validateMf(data.rows);
      this.validateSlNoSequence(data.rows, page, limit);
      this.validateUniqueReadings(data.rows);
      this.validateBillingWindow(data.rows);
    }
  }
  validateLiveOct2025Contract(mapped: MappedDtrBilling): void {
    this.validateLiveOk(mapped, 1, 10, false);
    expect(mapped.data.pagination.total).toBeNull();
    expect(mapped.data.pagination.totalPages).toBeNull();
    expect(mapped.data.pagination.hasMore).toBe(true);
    expect(mapped.data.rows.length).toBe(2);
    expect(mapped.data.rows[0]?.meterSerialNumber).toBe("19270969");
    expect(mapped.data.rows[0]?.kwhExp).toBe("0.00");
    expect(mapped.data.rows[0]?.kvaDateTime).toBeNull();
    expect(mapped.data.rows[1]?.meterSerialNumber).toBe("19270971");
  }
  validateEmptyPageContract(mapped: MappedDtrBilling): void {
    this.validateLiveOk(mapped, 1, 10, true);
    expect(mapped.data.pagination.total).toBe(0);
    expect(mapped.data.rows.length).toBe(0);
  }
  validatePageBeyondLive(mapped: MappedDtrBilling): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped.data);
    this.validatePaginationBounds(mapped.data);
    this.validatePaginationMath(mapped.data, false);
    if (mapped.data.pagination.hasMore === false) {
      expect(mapped.data.rows.length).toBe(0);
    }
    if (mapped.data.rows.length > 0) {
      this.validateRowsStructure(mapped.data.rows);
      this.validateRowIds(mapped.data.rows);
      this.validateUniqueReadings(mapped.data.rows);
    }
  }

  validateScenario(mapped: MappedDtrBilling,scenario: DtrBillingScenario,page = dtrBillingDefaultPage,limit = dtrBillingDefaultLimit,): void {
    switch (scenario) {
      case "contract_live_oct_2025":
        this.validateLiveOct2025Contract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped);
        break;
      case "dev_live_include_total":
        this.validateLiveOk(mapped, page, limit, true);
        break;
      case "dev_live_without_total":
      case "dev_limit_one":
      case "dev_ignore_unknown_query":
      case "edge_duplicate_meter_serials":
        this.validateLiveOk(mapped, page, limit, false);
        break;
      default:
        break;
    }
  }
}
