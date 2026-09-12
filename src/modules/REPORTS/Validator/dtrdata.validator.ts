import { expect } from "@playwright/test";
import {
  dtrDataDefaultLimit,
  dtrDataDefaultPage,
  dtrDataExpectedColumns,
} from "../Data/dtrdata.data";
import type {
  DtrDataErrorBody,
  DtrDataReportType,
  DtrDataResponse,
  DtrDataRow,
  DtrDataScenario,
  MappedDtrData,
} from "../Mapper/dtrdata.mapper";

const METER_TIME = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
const DECIMAL_OR_NULL = /^-?\d+(\.\d+)?$/;

function isNullableDecimal(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return DECIMAL_OR_NULL.test(String(value).trim());
}

export class DtrDataValidator {
  validateResponseEnvelope(response: DtrDataResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: DtrDataErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateBackgroundRequiredError(responseBody: DtrDataErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error?.code).toBe("REPORT_BACKGROUND_REQUIRED");
    expect(responseBody.error?.message).toBeTruthy();
    expect(responseBody.error?.details?.reportType).toBe("dp");
    expect(responseBody.error?.details?.maximumInteractiveRangeDays).toBe(7);
    expect(
      Number(responseBody.error?.details?.requestedRangeDays),
    ).toBeGreaterThan(7);
    expect(responseBody.error?.details?.exportSupported).toBe(true);
  }

  validateSuccess(mapped: MappedDtrData): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedDtrData): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
  }

  validateColumns(mapped: MappedDtrData, reportType: DtrDataReportType): void {
    const expected = dtrDataExpectedColumns(reportType);
    expect(mapped.columns.length).toBe(expected.length);
    const keys = mapped.columns.map((c) => c.key);
    for (const col of expected) {
      expect(keys).toContain(col.key);
      expect(mapped.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
    expect(keys).not.toContain("meterLookupId");
    expect(keys).not.toContain("dataSource");
  }

  validatePaginationEcho(
    mapped: MappedDtrData,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedDtrData): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  /**
   * includeTotal=false → total/totalPages may be null while rows still exist.
   */
  validatePaginationMath(mapped: MappedDtrData, includeTotal = false): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;
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
    if (hasMore != null) expect(hasMore).toBe(page < tp);
  }

  validateRowsStructure(rows: DtrDataRow[], reportType: DtrDataReportType): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(typeof row.meterTime).toBe("string");
      expect(typeof row.mf).toBe("string");
      expect(typeof row.meterLookupId).toBe("number");
      if (row.dataSource != null) {
        expect(typeof row.dataSource).toBe("string");
      }
      if (reportType === "ip") {
        expect(isNullableDecimal(row.vlR)).toBeTruthy();
        expect(isNullableDecimal(row.vlY)).toBeTruthy();
        expect(isNullableDecimal(row.vlB)).toBeTruthy();
        expect(isNullableDecimal(row.ir)).toBeTruthy();
        expect(isNullableDecimal(row.iy)).toBeTruthy();
        expect(isNullableDecimal(row.ib)).toBeTruthy();
        expect(isNullableDecimal(row.rPf)).toBeTruthy();
        expect(isNullableDecimal(row.yPf)).toBeTruthy();
        expect(isNullableDecimal(row.bPf)).toBeTruthy();
        expect(isNullableDecimal(row.avgPf)).toBeTruthy();
        expect(isNullableDecimal(row.kW)).toBeTruthy();
        expect(isNullableDecimal(row.kWh)).toBeTruthy();
        expect(isNullableDecimal(row.kVA)).toBeTruthy();
        expect(isNullableDecimal(row.kVAh)).toBeTruthy();
        expect(isNullableDecimal(row.kVAR)).toBeTruthy();
        expect(isNullableDecimal(row.freq)).toBeTruthy();
      } else if (reportType === "ls") {
        expect(isNullableDecimal(row.ir)).toBeTruthy();
        expect(isNullableDecimal(row.iy)).toBeTruthy();
        expect(isNullableDecimal(row.ib)).toBeTruthy();
        expect(isNullableDecimal(row.vlR)).toBeTruthy();
        expect(isNullableDecimal(row.vlY)).toBeTruthy();
        expect(isNullableDecimal(row.vlB)).toBeTruthy();
        expect(isNullableDecimal(row.kWh)).toBeTruthy();
        expect(isNullableDecimal(row.kWhExp)).toBeTruthy();
        expect(isNullableDecimal(row.kVAh)).toBeTruthy();
        expect(isNullableDecimal(row.kVAhExp)).toBeTruthy();
      } else {
        expect(isNullableDecimal(row.kWhImp)).toBeTruthy();
        expect(isNullableDecimal(row.kWhExp)).toBeTruthy();
        expect(isNullableDecimal(row.kVAhImp)).toBeTruthy();
        expect(isNullableDecimal(row.kVAhExp)).toBeTruthy();
      }
    }
  }

  /** Live ids: `row-{slNo}-{meterSerialNumber}-{meterLookupId}`. */
  validateRowIds(rows: DtrDataRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(
        `row-${row.slNo}-${row.meterSerialNumber}-${row.meterLookupId}`,
      );
    }
  }

  validateMeterFields(rows: DtrDataRow[]): void {
    for (const row of rows) {
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.mf.trim().length).toBeGreaterThan(0);
      expect(METER_TIME.test(row.meterTime.trim())).toBeTruthy();
      expect(row.dtr.trim().length).toBeGreaterThan(0);
    }
  }

  validateSlNoSequence(rows: DtrDataRow[], page: number, limit: number): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Same meter on different meterTimes is valid. Same feeder / DTR / time
   * on many meters is valid. Zero and negative PF / kW / current are valid.
   * Duplicate id, slNo, or meter+time / lookupId+time on one page is a fail.
   */
  validateUniqueReadings(rows: DtrDataRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const msnTimes = rows.map(
      (row) => `${row.meterSerialNumber}_${row.meterTime}`,
    );
    const lookupTimes = rows.map(
      (row) => `${row.meterLookupId}_${row.meterTime}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(msnTimes).size).toBe(msnTimes.length);
    expect(new Set(lookupTimes).size).toBe(lookupTimes.length);
  }

  validateLiveOk(
    mapped: MappedDtrData,
    reportType: DtrDataReportType,
    page = dtrDataDefaultPage,
    limit = dtrDataDefaultLimit,
    includeTotal = false,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, reportType);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, includeTotal);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows, reportType);
      this.validateRowIds(mapped.rows);
      this.validateMeterFields(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueReadings(mapped.rows);
    }
  }

  validateLiveIpContract(mapped: MappedDtrData): void {
    this.validateLiveOk(mapped, "ip", 1, 10, false);
    expect(mapped.pagination.total).toBeNull();
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("19271025");
    expect(mapped.rows[0]?.rPf).toBe("-0.996");
    expect(mapped.rows[1]?.meterSerialNumber).toBe("19271098");
    expect(mapped.rows[0]?.meterTime).toBe(mapped.rows[1]?.meterTime);
    expect(mapped.rows[0]?.meterSerialNumber).not.toBe(
      mapped.rows[1]?.meterSerialNumber,
    );
  }

  validateLiveLsContract(mapped: MappedDtrData): void {
    this.validateLiveOk(mapped, "ls", 1, 10, false);
    expect(mapped.pagination.total).toBeNull();
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("19271370");
    expect(mapped.rows[0]?.kWhExp).toBe("0.000");
    expect(mapped.rows[1]?.meterSerialNumber).toBe("19270978");
    expect(mapped.rows[0]?.meterTime).toBe(mapped.rows[1]?.meterTime);
  }

  validateEmptyPageContract(mapped: MappedDtrData): void {
    this.validateLiveOk(mapped, "ip", 1, 10, true);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePageBeyondLive(
    mapped: MappedDtrData,
    reportType: DtrDataReportType = "ip",
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, reportType);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, false);
    if (mapped.rows.length > 0) {
      this.validateUniqueReadings(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedDtrData,
    scenario: DtrDataScenario,
    page = dtrDataDefaultPage,
    limit = dtrDataDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_ip":
        this.validateLiveIpContract(mapped);
        break;
      case "contract_live_ls":
        this.validateLiveLsContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped, "ip");
        break;
      case "dev_live_ls":
        this.validateLiveOk(mapped, "ls", page, limit, false);
        break;
      case "dev_live_dp_week":
        this.validateLiveOk(mapped, "dp", page, limit, false);
        break;
      case "dev_live_include_total":
        this.validateLiveOk(mapped, "ip", page, limit, true);
        break;
      case "dev_limit_one":
        this.validateLiveOk(mapped, "ip", page, limit, false);
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
        break;
      case "dev_live_primary":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, "ip", page, limit, false);
        break;
      default:
        break;
    }
  }
}
