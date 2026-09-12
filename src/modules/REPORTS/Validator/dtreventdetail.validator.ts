import { expect } from "@playwright/test";
import {
  dtrEventDetailDefaultLimit,
  dtrEventDetailDefaultPage,
  dtrEventDetailExpectedColumns,
} from "../Data/dtreventdetail.data";
import type {
  DtrEventDetailErrorBody,
  DtrEventDetailResponse,
  DtrEventDetailRow,
  DtrEventDetailScenario,
  MappedDtrEventDetail,
} from "../Mapper/dtreventdetail.mapper";
import { dtrEventDetailColumnKeys } from "../Mapper/dtreventdetail.mapper";

/** Live header is Duration (DD:HH:MM); values are `H:MM:SS` (e.g. 1:06:00, 0:03:20). */
const DURATION_H_MM_SS = /^\d+:\d{2}:\d{2}$/;
const LOG_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDuration(value: string): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  return { hours, minutes, seconds };
}

export class DtrEventDetailValidator {
  validateResponseEnvelope(response: DtrEventDetailResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: DtrEventDetailErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedDtrEventDetail): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedDtrEventDetail): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(typeof mapped.pagination.total).toBe("number");
    expect(typeof mapped.pagination.totalPages).toBe("number");
  }

  validateColumns(mapped: MappedDtrEventDetail): void {
    expect(mapped.columns.length).toBe(dtrEventDetailExpectedColumns.length);
    const keys = mapped.columns.map((column) => column.key);
    for (const expected of dtrEventDetailExpectedColumns) {
      expect(keys).toContain(expected.key);
      const column = mapped.columns.find((c) => c.key === expected.key);
      expect(column?.header).toBe(expected.header);
      expect(dtrEventDetailColumnKeys).toContain(expected.key);
    }
    expect(keys).not.toContain("dtrNetworkLookupId");
    expect(keys).not.toContain("meterLookupId");
    expect(keys).not.toContain("eventId");
  }

  validatePaginationEcho(
    mapped: MappedDtrEventDetail,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedDtrEventDetail): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
    expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validatePaginationMath(mapped: MappedDtrEventDetail): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;
    if (total === 0) {
      expect(rows.length).toBe(0);
      expect(totalPages).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(totalPages).toBe(Math.ceil(total / limit));
    expect(total).toBeGreaterThanOrEqual(rows.length);
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < totalPages);
  }

  validateRowsStructure(rows: DtrEventDetailRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(typeof row.dtrType).toBe("string");
      expect(
        row.dtrRating == null || typeof row.dtrRating === "number",
      ).toBeTruthy();
      expect(typeof row.msn).toBe("string");
      expect(typeof row.logDate).toBe("string");
      expect(typeof row.eventClassificationName).toBe("string");
      expect(typeof row.eventName).toBe("string");
      expect(typeof row.priority).toBe("string");
      expect(typeof row.eventCount).toBe("number");
      expect(typeof row.durationHhMm).toBe("string");
      expect(typeof row.dtrNetworkLookupId).toBe("number");
      expect(typeof row.meterLookupId).toBe("number");
      expect(typeof row.eventId).toBe("number");
    }
  }

  /** Live ids: `row-{slNo}-{msn}-{meterLookupId}-{eventId}`. */
  validateRowIds(rows: DtrEventDetailRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(
        `row-${row.slNo}-${row.msn}-${row.meterLookupId}-${row.eventId}`,
      );
    }
  }

  validateEventFields(rows: DtrEventDetailRow[]): void {
    for (const row of rows) {
      expect(row.dtr.trim().length).toBeGreaterThan(0);
      expect(row.msn.trim().length).toBeGreaterThan(0);
      expect(/^\d+$/.test(row.msn.trim())).toBeTruthy();
      expect(LOG_DATE.test(row.logDate)).toBeTruthy();
      expect(row.eventName.trim().length).toBeGreaterThan(0);
      expect(row.eventClassificationName.trim().length).toBeGreaterThan(0);
      expect(row.priority.trim().length).toBeGreaterThan(0);
      expect(row.eventCount).toBeGreaterThanOrEqual(0);
      expect(row.dtrNetworkLookupId!).toBeGreaterThan(0);
      expect(row.meterLookupId!).toBeGreaterThan(0);
      expect(row.eventId!).toBeGreaterThan(0);
    }
  }

  validateDurationFormat(rows: DtrEventDetailRow[]): void {
    for (const row of rows) {
      expect(DURATION_H_MM_SS.test(row.durationHhMm)).toBeTruthy();
      const { hours, minutes, seconds } = parseDuration(row.durationHhMm);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThan(60);
    }
  }

  validateSlNoSequence(
    rows: DtrEventDetailRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Same MSN / DTR / meter on many event types or dates is valid.
   * Duplicate id, slNo, or meterLookupId+eventId+logDate is a fail.
   */
  validateUniqueMeterEvents(rows: DtrEventDetailRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const meterEvents = rows.map(
      (row) => `${row.meterLookupId}_${row.eventId}_${row.logDate}`,
    );
    const msnEvents = rows.map(
      (row) => `${row.msn}_${row.eventId}_${row.logDate}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(meterEvents).size).toBe(meterEvents.length);
    expect(new Set(msnEvents).size).toBe(msnEvents.length);
  }

  validateNoDataScenario(mapped: MappedDtrEventDetail): void {
    if (mapped.pagination.total === 0) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validatePageBeyondTotal(
    mapped: MappedDtrEventDetail,
    requestedPage: number,
  ): void {
    if (
      mapped.pagination.totalPages > 0 &&
      requestedPage > mapped.pagination.totalPages
    ) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validateLiveOk(
    mapped: MappedDtrEventDetail,
    page = dtrEventDetailDefaultPage,
    limit = dtrEventDetailDefaultLimit,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validateNoDataScenario(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateEventFields(mapped.rows);
      this.validateDurationFormat(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueMeterEvents(mapped.rows);
    }
  }

  validateLiveFullContract(mapped: MappedDtrEventDetail): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(18888);
    expect(mapped.pagination.totalPages).toBe(1889);
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.msn).toBe("19271510");
    expect(mapped.rows[1]?.msn).toBe("19271510");
    expect(mapped.rows[0]?.meterLookupId).toBe(mapped.rows[1]?.meterLookupId);
    expect(mapped.rows[0]?.eventId).not.toBe(mapped.rows[1]?.eventId);
    expect(mapped.rows[0]?.dtrType).toBe("");
  }

  validateEmptyPageContract(mapped: MappedDtrEventDetail): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePage2Live(mapped: MappedDtrEventDetail, requestedPage: number): void {
    this.validateLiveOk(mapped, requestedPage, dtrEventDetailDefaultLimit);
    if (mapped.rows.length > 0) {
      expect(mapped.rows[0]?.slNo).toBeGreaterThan(dtrEventDetailDefaultLimit);
    }
  }

  validatePageBeyondLive(
    mapped: MappedDtrEventDetail,
    requestedPage: number,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validatePageBeyondTotal(mapped, requestedPage);
    if (mapped.rows.length > 0) {
      this.validateUniqueMeterEvents(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedDtrEventDetail,
    scenario: DtrEventDetailScenario,
    page = dtrEventDetailDefaultPage,
    limit = dtrEventDetailDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_full":
        this.validateLiveFullContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page2":
        this.validatePage2Live(mapped, page);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped, page);
        break;
      case "dev_live_primary":
      case "dev_ignore_unknown_query":
      case "dev_limit_one":
        this.validateLiveOk(mapped, page, limit);
        break;
      default:
        break;
    }
  }
}
