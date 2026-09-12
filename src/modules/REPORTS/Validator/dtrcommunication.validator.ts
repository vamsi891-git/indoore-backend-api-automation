import { expect } from "@playwright/test";
import {
  dtrCommunicationReportDefaultLimit,
  dtrCommunicationReportDefaultPage,
  dtrCommunicationReportExpectedColumns,
} from "../Data/dtrcommunication.data";
import type {
  DtrCommunicationReportErrorBody,
  DtrCommunicationReportResponse,
  DtrCommunicationReportRow,
  DtrCommunicationReportScenario,
  MappedDtrCommunicationReport,
} from "../Mapper/dtrcommunication.mapper";
import { dtrCommunicationReportColumnKeys } from "../Mapper/dtrcommunication.mapper";

/** Live: `30/10/2025 00:00:00` */
const LOG_DATE = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;

export class DtrCommunicationReportValidator {
  validateResponseEnvelope(response: DtrCommunicationReportResponse,): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }
  validateValidationError(responseBody: DtrCommunicationReportErrorBody,): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }
  validateSuccess(mapped: MappedDtrCommunicationReport): void {
    expect(mapped.success).toBeTruthy();
  }
  validateRootStructure(mapped: MappedDtrCommunicationReport): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
  }
  validateColumns(mapped: MappedDtrCommunicationReport): void {
    expect(mapped.columns.length).toBe(
      dtrCommunicationReportExpectedColumns.length,
    );
    const keys = mapped.columns.map((column) => column.key);
    for (const expected of dtrCommunicationReportExpectedColumns) {
      expect(keys).toContain(expected.key);
      const column = mapped.columns.find((c) => c.key === expected.key);
      expect(column?.header).toBe(expected.header);
      expect(dtrCommunicationReportColumnKeys).toContain(expected.key);
    }
    expect(keys).not.toContain("meterLookupId");
  }
  validatePaginationEcho(mapped: MappedDtrCommunicationReport,page: number,limit: number,): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }
  validatePaginationBounds(mapped: MappedDtrCommunicationReport): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }
  /**
   * `includeTotal=false`: total/totalPages may be null; do not treat as empty.
   * `includeTotal=true`: enforce ceil math when total is present.
   */
  validatePaginationMath(mapped: MappedDtrCommunicationReport,includeTotal = false,): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } = mapped.pagination;
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
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < tp);
  }
  validateRowsLimit(mapped: MappedDtrCommunicationReport): void {
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }
  validatePageBeyondTotal(mapped: MappedDtrCommunicationReport,requestedPage: number,): void {
    const { totalPages } = mapped.pagination;
    if (totalPages != null && totalPages > 0 && requestedPage > totalPages) {
      expect(mapped.rows.length).toBe(0);
    }
  }
  validateRowsStructure(rows: DtrCommunicationReportRow[]): void {
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
      expect(typeof row.logDate).toBe("string");
      expect(typeof row.ipCount === "number" || row.ipCount === null).toBeTruthy();
      expect(typeof row.lsCount === "number" || row.lsCount === null).toBeTruthy();
      expect(typeof row.dpCount === "number" || row.dpCount === null).toBeTruthy();
      expect(typeof row.meterLookupId).toBe("number");
    }
  }
  /** Live ids: `row-{slNo}-{meterSerialNumber}-{meterLookupId}`. */
  validateRowIds(rows: DtrCommunicationReportRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(
        `row-${row.slNo}-${row.meterSerialNumber}-${row.meterLookupId}`,
      );
    }
  }
  validateMeterAndCounts(
    rows: DtrCommunicationReportRow[],
    countsRequired = true,
  ): void {
    for (const row of rows) {
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(LOG_DATE.test(row.logDate.trim())).toBeTruthy();
      for (const count of [row.ipCount, row.lsCount, row.dpCount]) {
        if (countsRequired) {
          expect(typeof count).toBe("number");
          expect(count as number).toBeGreaterThanOrEqual(0);
        } else {
          expect(count === null || typeof count === "number").toBeTruthy();
          if (typeof count === "number") {
            expect(count).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  }
  validateHierarchyFields(rows: DtrCommunicationReportRow[]): void {
    for (const row of rows) {
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(row.dtr.trim().length).toBeGreaterThan(0);
    }
  }
  validateSlNoSequence(rows: DtrCommunicationReportRow[],page: number,limit: number,): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }
  /**
   * Same DTR / feeder / log date / IP=0 on many meters is valid.
   * Duplicate id, slNo, or meter+logDate / lookupId+logDate on one page is a fail.
   */
  validateUniqueMeters(rows: DtrCommunicationReportRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const msnDates = rows.map(
      (row) => `${row.meterSerialNumber}_${row.logDate}`,
    );
    const lookupDates = rows.map(
      (row) => `${row.meterLookupId}_${row.logDate}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(msnDates).size).toBe(msnDates.length);
    expect(new Set(lookupDates).size).toBe(lookupDates.length);
  }
  validateLiveOk(
    mapped: MappedDtrCommunicationReport,
    page = dtrCommunicationReportDefaultPage,
    limit = dtrCommunicationReportDefaultLimit,
    includeTotal = false,
    countsRequired = true,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, includeTotal);
    this.validateRowsLimit(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateMeterAndCounts(mapped.rows, countsRequired);
      this.validateHierarchyFields(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueMeters(mapped.rows);
    }
  }
  validateLiveFullContract(mapped: MappedDtrCommunicationReport): void {
    this.validateLiveOk(mapped, 1, 10, false);
    expect(mapped.pagination.total).toBeNull();
    expect(mapped.pagination.totalPages).toBeNull();
    expect(mapped.pagination.totalIsExact).toBe(false);
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("19271956");
    expect(mapped.rows[0]?.meterLookupId).toBe(88544);
    expect(mapped.rows[0]?.logDate).toBe("30/10/2025 00:00:00");
    expect(mapped.rows[1]?.meterSerialNumber).toBe("19271924");
    expect(mapped.rows[0]?.feeder).toBe(mapped.rows[1]?.feeder);
    expect(mapped.rows[0]?.dtr).not.toBe(mapped.rows[1]?.dtr);
    expect(mapped.rows[0]?.meterSerialNumber).not.toBe(
      mapped.rows[1]?.meterSerialNumber,
    );
  }
  validateEmptyPageContract(mapped: MappedDtrCommunicationReport): void {
    this.validateLiveOk(mapped, 1, 10, true);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }
  validatePageBeyondLive(mapped: MappedDtrCommunicationReport,requestedPage: number,): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, false);
    this.validatePageBeyondTotal(mapped, requestedPage);
    if (mapped.rows.length > 0) {
      this.validateUniqueMeters(mapped.rows);
    }
  }
  validateScenario(mapped: MappedDtrCommunicationReport,scenario: DtrCommunicationReportScenario,page = dtrCommunicationReportDefaultPage,limit = dtrCommunicationReportDefaultLimit,): void {
    switch (scenario) {
      case "contract_live_full":
        this.validateLiveFullContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped, page);
        break;
      case "dev_live_include_total":
        this.validateLiveOk(mapped, page, limit, true);
        break;
      case "dev_live_archive_false":
        this.validateLiveOk(mapped, page, limit, false, false);
        break;
      case "dev_live_primary":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, page, limit, false);
        break;
      case "dev_limit_one":
        this.validateLiveOk(mapped, page, limit, false);
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
        break;
      default:
        break;
    }
  }
}
